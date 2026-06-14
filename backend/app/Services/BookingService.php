<?php

namespace App\Services;

use App\Models\Booking;
use App\Repositories\BookingRepository;
use Carbon\CarbonImmutable;
use Illuminate\Validation\ValidationException;

class BookingService
{
    public function __construct(private readonly BookingRepository $bookings) {}

    /**
     * Create a booking, enforcing the no-overlap invariant.
     *
     * @param  array<string, mixed>  $data  validated payload from StoreBookingRequest
     *
     * @throws ValidationException on overlap (surfaced as a 422)
     */
    public function create(array $data): Booking
    {
        $roomId = (int) $data['room_id'];
        $start = CarbonImmutable::parse($data['start_time'])->utc();
        $end = CarbonImmutable::parse($data['end_time'])->utc();

        // Atomic: lock the room, then re-check overlap inside the same
        // transaction so two concurrent requests can't both pass the check and
        // double-book the slot.
        return $this->bookings->transaction(function () use ($roomId, $start, $end, $data) {
            $this->bookings->lockRoom($roomId);

            if ($this->bookings->overlaps($roomId, $start, $end)) {
                throw ValidationException::withMessages([
                    'start_time' => ['This time range overlaps an existing booking for the selected room.'],
                ]);
            }

            return $this->bookings->create([
                'room_id' => $roomId,
                'user_name' => $data['user_name'],
                'start_time' => $start,
                'end_time' => $end,
            ]);
        });
    }

    public function delete(Booking $booking): void
    {
        $this->bookings->delete($booking);
    }
}
