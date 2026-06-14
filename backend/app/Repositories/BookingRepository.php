<?php

namespace App\Repositories;

use App\Models\Booking;
use App\Models\Room;
use DateTimeInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class BookingRepository
{
    /**
     * Run a unit of work in a transaction. Used to make the overlap
     * check-then-insert atomic.
     *
     * @template T
     *
     * @param  callable(): T  $callback
     * @return T
     */
    public function transaction(callable $callback)
    {
        return DB::transaction($callback);
    }

    /**
     * Acquire a write lock on the room row for the current transaction, so
     * concurrent bookings for the same room serialize through the overlap
     * check instead of racing it.
     */
    public function lockRoom(int $roomId): void
    {
        Room::query()->whereKey($roomId)->lockForUpdate()->first();
    }

    /**
     * Bookings for a single room, ordered chronologically.
     *
     * @return Collection<int, Booking>
     */
    public function forRoom(Room $room): Collection
    {
        return $room->bookings()->orderBy('start_time')->get();
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes): Booking
    {
        return Booking::query()->create($attributes);
    }

    public function delete(Booking $booking): void
    {
        $booking->delete();
    }

    /**
     * Does any booking in this room overlap [start, end)?
     *
     * Resolved entirely in the database via a `select exists(...)` query —
     * no rows are hydrated into PHP. Two intervals overlap iff
     * `existing.start < new.end AND existing.end > new.start`. The strict
     * inequalities make back-to-back bookings (end == start) non-overlapping.
     *
     * @param  int|null  $excludeId  ignore this booking (future update path)
     */
    public function overlaps(
        int $roomId,
        DateTimeInterface $start,
        DateTimeInterface $end,
        ?int $excludeId = null,
    ): bool {
        return Booking::query()
            ->where('room_id', $roomId)
            ->when($excludeId !== null, fn ($query) => $query->whereKeyNot($excludeId))
            ->where('start_time', '<', $end)
            ->where('end_time', '>', $start)
            ->exists();
    }
}
