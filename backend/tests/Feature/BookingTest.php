<?php

use App\Models\Booking;
use App\Models\Room;
use App\Models\User;
use Carbon\CarbonImmutable;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\deleteJson;
use function Pest\Laravel\getJson;
use function Pest\Laravel\postJson;

/**
 * Seed a room with one existing booking from 10:00 to 11:00 UTC, and
 * return [room, admin] ready for the overlap matrix.
 *
 * @return array{0: Room, 1: User}
 */
function seedRoomWithBooking(): array
{
    $room = Room::factory()->create();
    $admin = User::factory()->create();

    Booking::factory()->forWindow(
        $room,
        CarbonImmutable::parse('2026-01-01T10:00:00Z'),
        CarbonImmutable::parse('2026-01-01T11:00:00Z'),
    )->create();

    return [$room, $admin];
}

/**
 * Attempt to book the given window as the admin and return the response.
 */
function book(Room $room, User $admin, string $start, string $end)
{
    return actingAs($admin, 'sanctum')->postJson('/api/bookings', [
        'room_id' => $room->id,
        'user_name' => 'Jane Doe',
        'start_time' => $start,
        'end_time' => $end,
    ]);
}

describe('GET /api/rooms', function () {
    it('is public and lists rooms', function () {
        Room::factory()->count(3)->create();

        getJson('/api/rooms')
            ->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonStructure(['data' => [['id', 'name', 'capacity']]]);
    });
});

describe('GET /api/rooms/{room}/bookings', function () {
    it('is public and lists a room\'s bookings ordered by start time', function () {
        $room = Room::factory()->create();
        Booking::factory()->forWindow(
            $room,
            CarbonImmutable::parse('2026-01-01T14:00:00Z'),
            CarbonImmutable::parse('2026-01-01T15:00:00Z'),
        )->create();
        Booking::factory()->forWindow(
            $room,
            CarbonImmutable::parse('2026-01-01T09:00:00Z'),
            CarbonImmutable::parse('2026-01-01T10:00:00Z'),
        )->create();

        $response = getJson("/api/rooms/{$room->id}/bookings")->assertOk();

        expect($response->json('data'))->toHaveCount(2);
        expect($response->json('data.0.start_time'))->toStartWith('2026-01-01T09:00:00');
    });

    it('returns 404 for an unknown room', function () {
        getJson('/api/rooms/999999/bookings')->assertNotFound();
    });
});

describe('POST /api/bookings — auth', function () {
    it('requires authentication', function () {
        $room = Room::factory()->create();

        postJson('/api/bookings', [
            'room_id' => $room->id,
            'user_name' => 'Jane Doe',
            'start_time' => '2026-01-01T10:00:00Z',
            'end_time' => '2026-01-01T11:00:00Z',
        ])->assertUnauthorized();
    });

    it('creates a booking for an authenticated admin', function () {
        [$room, $admin] = seedRoomWithBooking();

        book($room, $admin, '2026-01-01T12:00:00Z', '2026-01-01T13:00:00Z')
            ->assertCreated()
            ->assertJsonPath('data.room_id', $room->id)
            ->assertJsonPath('data.user_name', 'Jane Doe');

        expect(Booking::where('room_id', $room->id)->count())->toBe(2);
    });
});

describe('POST /api/bookings — validation', function () {
    it('rejects end_time that is not after start_time', function () {
        [$room, $admin] = seedRoomWithBooking();

        book($room, $admin, '2026-01-01T13:00:00Z', '2026-01-01T13:00:00Z')
            ->assertStatus(422)
            ->assertJsonValidationErrors('end_time');
    });

    it('rejects a non-existent room', function () {
        $admin = User::factory()->create();

        actingAs($admin, 'sanctum')->postJson('/api/bookings', [
            'room_id' => 999999,
            'user_name' => 'Jane Doe',
            'start_time' => '2026-01-01T10:00:00Z',
            'end_time' => '2026-01-01T11:00:00Z',
        ])->assertStatus(422)->assertJsonValidationErrors('room_id');
    });
});

/**
 * The overlap matrix. Existing booking is 10:00–11:00.
 * Each case books a new window and asserts whether it conflicts.
 */
describe('POST /api/bookings — overlap rule (existing 10:00–11:00)', function () {
    it('rejects an identical window', function () {
        [$room, $admin] = seedRoomWithBooking();
        book($room, $admin, '2026-01-01T10:00:00Z', '2026-01-01T11:00:00Z')
            ->assertStatus(422)->assertJsonValidationErrors('start_time');
    });

    it('rejects a new window fully inside the existing one', function () {
        [$room, $admin] = seedRoomWithBooking();
        book($room, $admin, '2026-01-01T10:15:00Z', '2026-01-01T10:45:00Z')
            ->assertStatus(422)->assertJsonValidationErrors('start_time');
    });

    it('rejects a new window that fully contains the existing one', function () {
        [$room, $admin] = seedRoomWithBooking();
        book($room, $admin, '2026-01-01T09:00:00Z', '2026-01-01T12:00:00Z')
            ->assertStatus(422)->assertJsonValidationErrors('start_time');
    });

    it('rejects a window overlapping the start edge', function () {
        [$room, $admin] = seedRoomWithBooking();
        book($room, $admin, '2026-01-01T09:30:00Z', '2026-01-01T10:30:00Z')
            ->assertStatus(422)->assertJsonValidationErrors('start_time');
    });

    it('rejects a window overlapping the end edge', function () {
        [$room, $admin] = seedRoomWithBooking();
        book($room, $admin, '2026-01-01T10:30:00Z', '2026-01-01T11:30:00Z')
            ->assertStatus(422)->assertJsonValidationErrors('start_time');
    });

    it('ALLOWS a back-to-back booking ending exactly at the existing start', function () {
        [$room, $admin] = seedRoomWithBooking();
        book($room, $admin, '2026-01-01T09:00:00Z', '2026-01-01T10:00:00Z')
            ->assertCreated();
    });

    it('ALLOWS a back-to-back booking starting exactly at the existing end', function () {
        [$room, $admin] = seedRoomWithBooking();
        book($room, $admin, '2026-01-01T11:00:00Z', '2026-01-01T12:00:00Z')
            ->assertCreated();
    });

    it('ALLOWS the same window in a different room', function () {
        [, $admin] = seedRoomWithBooking();
        $otherRoom = Room::factory()->create();
        book($otherRoom, $admin, '2026-01-01T10:00:00Z', '2026-01-01T11:00:00Z')
            ->assertCreated();
    });
});

describe('DELETE /api/bookings/{booking}', function () {
    it('requires authentication', function () {
        [$room] = seedRoomWithBooking();
        $booking = Booking::where('room_id', $room->id)->first();

        deleteJson("/api/bookings/{$booking->id}")->assertUnauthorized();
    });

    it('deletes a booking for an authenticated admin', function () {
        [$room, $admin] = seedRoomWithBooking();
        $booking = Booking::where('room_id', $room->id)->first();

        actingAs($admin, 'sanctum')
            ->deleteJson("/api/bookings/{$booking->id}")
            ->assertNoContent();

        expect(Booking::find($booking->id))->toBeNull();
    });

    it('returns 404 for an unknown booking', function () {
        $admin = User::factory()->create();

        actingAs($admin, 'sanctum')
            ->deleteJson('/api/bookings/999999')
            ->assertNotFound();
    });
});
