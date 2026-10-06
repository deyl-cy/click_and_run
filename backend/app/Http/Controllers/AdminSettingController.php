<?php

namespace App\Http\Controllers;

use App\Services\ActivityLogger;
use App\Services\SettingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminSettingController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => SettingService::all(),
            'defaults' => SettingService::DEFAULTS,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'default_confidence' => ['required', 'integer', 'between:5,95'],
            'idle_timeout_minutes' => ['required', 'integer', 'between:2,120'],
            'lab_name' => ['required', 'string', 'max:100'],
        ]);

        $settings = SettingService::update($validated);

        ActivityLogger::log(
            'settings.updated',
            'Updated system settings.',
            $request->user()
        );

        return response()->json([
            'message' => 'Settings saved successfully.',
            'data' => $settings,
        ]);
    }

    public function reset(Request $request): JsonResponse
    {
        $settings = SettingService::reset();

        ActivityLogger::log(
            'settings.updated',
            'Reset system settings to defaults.',
            $request->user()
        );

        return response()->json([
            'message' => 'Settings reset to defaults.',
            'data' => $settings,
        ]);
    }
}
