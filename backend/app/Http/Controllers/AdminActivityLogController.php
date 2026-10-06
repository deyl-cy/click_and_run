<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminActivityLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'action' => ['nullable', 'string', 'max:50'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
        ]);

        $query = ActivityLog::query()->latest('created_at')->latest('id');

        if (!empty($validated['search'])) {
            $term = '%' . $validated['search'] . '%';

            $query->where(function ($q) use ($term) {
                $q->where('description', 'like', $term)
                    ->orWhere('user_name', 'like', $term)
                    ->orWhere('ip_address', 'like', $term);
            });
        }

        if (!empty($validated['action'])) {
            $action = $validated['action'];

            // "auth", "report", "user" match the whole group.
            if (!str_contains($action, '.')) {
                $query->where('action', 'like', $action . '.%');
            } else {
                $query->where('action', $action);
            }
        }

        if (!empty($validated['from'])) {
            $query->whereDate('created_at', '>=', $validated['from']);
        }

        if (!empty($validated['to'])) {
            $query->whereDate('created_at', '<=', $validated['to']);
        }

        $logs = $query->paginate($validated['per_page'] ?? 15);

        return response()->json([
            'data' => $logs->items(),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
            ],
            'actions' => ActivityLogger::ACTIONS,
        ]);
    }
}
