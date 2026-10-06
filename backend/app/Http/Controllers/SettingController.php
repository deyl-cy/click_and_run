<?php

namespace App\Http\Controllers;

use App\Services\SettingService;
use Illuminate\Http\JsonResponse;

class SettingController extends Controller
{
    /**
     * Settings every signed-in user needs (read only).
     */
    public function show(): JsonResponse
    {
        return response()->json([
            'data' => SettingService::all(),
        ]);
    }
}
