<?php

namespace Database\Factories;

use App\Models\Booking;
use App\Models\Room;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Booking>
 */
class BookingFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $start = CarbonImmutable::parse(fake()->dateTimeBetween('+1 day', '+2 days'))
            ->utc()
            ->startOfHour();

        return [
            'room_id' => Room::factory(),
            'user_name' => fake()->name(),
            'start_time' => $start,
            'end_time' => $start->addHour(),
        ];
    }

    /**
     * Place the booking in a specific room over an explicit window.
     */
    public function forWindow(Room $room, CarbonImmutable $start, CarbonImmutable $end): static
    {
        return $this->state(fn () => [
            'room_id' => $room->id,
            'start_time' => $start,
            'end_time' => $end,
        ]);
    }
}
