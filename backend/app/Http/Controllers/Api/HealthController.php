<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

/**
 * Lightweight readiness probe — the SPA pings this before rendering so users
 * never hit a half-awake backend (e.g. a cold-started free instance).
 */
class HealthController extends Controller
{
    public function show(): JsonResponse
    {
        return response()->json(['status' => 'ok']);
    }
}
