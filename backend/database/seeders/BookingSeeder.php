<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\Room;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;

/**
 * A few sample bookings so a fresh deploy has something to show. Idempotent
 * (keyed by room + name) and always future-dated, so re-running keeps the demo
 * current without creating duplicates.
 */
class BookingSeeder extends Seeder
{
    public function run(): void
    {
        $room = Room::query()->where('name', 'Alpha')->first();

        if (! $room) {
            return;
        }

        $base = CarbonImmutable::now()->utc()->addDay()->setTime(9, 0);

        $samples = [
            ['user_name' => 'Sofia Nguyen', 'start' => $base, 'end' => $base->addHour()],
            ['user_name' => 'Marcus Lee', 'start' => $base->addHours(2), 'end' => $base->addHours(3)],
            ['user_name' => 'Priya Sharma', 'start' => $base->addHours(5), 'end' => $base->addHours(6)],
        ];

        foreach ($samples as $sample) {
            Booking::query()->updateOrCreate(
                ['room_id' => $room->id, 'user_name' => $sample['user_name']],
                ['start_time' => $sample['start'], 'end_time' => $sample['end']],
            );
        }
    }
}
