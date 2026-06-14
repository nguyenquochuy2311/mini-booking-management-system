<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBookingRequest;
use App\Http\Resources\BookingResource;
use App\Models\Booking;
use App\Services\BookingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class BookingController extends Controller
{
    public function __construct(private readonly BookingService $service) {}

    /**
     * POST /api/bookings — auth:sanctum.
     * Returns 201 with the created booking, or 422 on validation/overlap.
     */
    public function store(StoreBookingRequest $request): JsonResponse
    {
        $booking = $this->service->create($request->validated());

        return BookingResource::make($booking)
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    /**
     * DELETE /api/bookings/{booking} — auth:sanctum.
     * Route-model binding yields a 404 when the booking does not exist.
     */
    public function destroy(Booking $booking): Response
    {
        $this->service->delete($booking);

        return response()->noContent();
    }
}
