<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\getJson;
use function Pest\Laravel\postJson;

describe('POST /api/login', function () {
    it('issues a token for valid credentials', function () {
        User::factory()->create([
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
        ]);

        postJson('/api/login', [
            'email' => 'admin@example.com',
            'password' => 'password',
        ])
            ->assertOk()
            ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email']]);
    });

    it('rejects invalid credentials with 422', function () {
        User::factory()->create([
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
        ]);

        postJson('/api/login', [
            'email' => 'admin@example.com',
            'password' => 'wrong-password',
        ])->assertStatus(422)->assertJsonValidationErrors('email');
    });

    it('validates required fields', function () {
        postJson('/api/login', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password']);
    });

    it('rate-limits repeated login attempts', function () {
        // Unique email isolates this test's throttle bucket (keyed by email+ip).
        $email = 'ratelimit-test@example.com';
        $payload = ['email' => $email, 'password' => 'whatever'];

        // The limiter allows 10/min; the 11th attempt is blocked with 429.
        for ($i = 0; $i < 10; $i++) {
            expect(postJson('/api/login', $payload)->status())->not->toBe(429);
        }

        postJson('/api/login', $payload)->assertStatus(429);
    });
});

describe('GET /api/user (token check)', function () {
    it('returns the user for a valid token', function () {
        $user = User::factory()->create();

        actingAs($user, 'sanctum')
            ->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('email', $user->email);
    });

    it('rejects an unauthenticated request', function () {
        getJson('/api/user')->assertUnauthorized();
    });
});

describe('Health probe', function () {
    it('returns ok without auth', function () {
        getJson('/api/health')->assertOk()->assertJson(['status' => 'ok']);
    });
});

describe('Security headers', function () {
    it('sets defensive headers on API responses', function () {
        getJson('/api/rooms')
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('X-Frame-Options', 'DENY')
            ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    });
});
