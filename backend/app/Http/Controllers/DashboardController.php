<?php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
        ]);

        $user = $request->user();

        // Admin: every analyst's reports. Analyst: only their own.
        $query = Report::query()->visibleTo($user);

        if ($request->filled('from')) {
            $query->whereDate(
                'reading_date',
                '>=',
                $request->input('from')
            );
        }

        if ($request->filled('to')) {
            $query->whereDate(
                'reading_date',
                '<=',
                $request->input('to')
            );
        }

        $totalReports = (clone $query)->count();

        $totalSeeds = (clone $query)->sum('total_count');

        $averageViability = (clone $query)->avg('viability');

        $averagePredictedGermination =
            (clone $query)->avg('predicted_germination');

        $totalNormal = (clone $query)->sum('normal_count');

        $totalAbnormal = (clone $query)->sum('abnormal_count');

        $totalDead = (clone $query)->sum('dead_count');

        $recentReports = (clone $query)
            ->with('user:id,name')
            ->latest()
            ->limit(5)
            ->get([
                'id',
                'user_id',
                'seed_lot_no',
                'accession',
                'reading_date',
                'replicate_number',
                'normal_count',
                'abnormal_count',
                'dead_count',
                'total_count',
                'viability',
                'predicted_germination',
            ]);

        $analytics = (clone $query)
            ->orderBy('reading_date')
            ->orderBy('id')
            ->get([
                'id',
                'seed_lot_no',
                'reading_date',
                'viability',
                'predicted_germination',
                'total_count',
            ]);

        $data = [
            'filters' => [
                'from' => $request->input('from'),
                'to' => $request->input('to'),
            ],

            'statistics' => [
                'totalReports' => $totalReports,
                'totalSeeds' => $totalSeeds,
                'averageViability' =>
                    round($averageViability ?? 0, 1),
                'averagePredictedGermination' =>
                    round(
                        $averagePredictedGermination ?? 0,
                        1
                    ),
                'normalCount' => $totalNormal,
                'abnormalCount' => $totalAbnormal,
                'deadCount' => $totalDead,
            ],

            'recentReports' => $recentReports,

            'analytics' => $analytics,
        ];

        // Per-analyst breakdown (admin only).
        if ($user->isAdmin()) {
            $names = User::pluck('name', 'id');

            $data['analysts'] = (clone $query)
                ->selectRaw(
                    'user_id, COUNT(*) as reports, ' .
                    'SUM(total_count) as seeds, ' .
                    'AVG(viability) as viability, ' .
                    'AVG(predicted_germination) as germination'
                )
                ->groupBy('user_id')
                ->get()
                ->map(fn ($row) => [
                    'user_id' => $row->user_id,
                    'name' => $names[$row->user_id] ?? 'Unknown',
                    'reports' => (int) $row->reports,
                    'seeds' => (int) $row->seeds,
                    'viability' => round((float) $row->viability, 1),
                    'germination' => round((float) $row->germination, 1),
                ])
                ->sortByDesc('reports')
                ->values();
        }

        return response()->json([
            'data' => $data,
        ]);
    }
}