<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\RoomController;
use Illuminate\Support\Facades\Route;

// Public — anyone can browse rooms and a room's bookings.
Route::post('login', [AuthController::class, 'login'])->middleware('throttle:login');
Route::get('rooms', [RoomController::class, 'index']);
Route::get('rooms/{room}/bookings', [RoomController::class, 'bookings']);

// Protected — only authenticated admins mutate bookings.
Route::middleware('auth:sanctum')->group(function () {
    Route::get('user', [AuthController::class, 'me']);
    Route::post('bookings', [BookingController::class, 'store']);
    Route::delete('bookings/{booking}', [BookingController::class, 'destroy']);
    Route::post('logout', [AuthController::class, 'logout']);
});
