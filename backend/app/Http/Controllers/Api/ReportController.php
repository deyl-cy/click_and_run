<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Report;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ReportController extends Controller
{
    /**
     * Display the reports the user may see
     * (admin: all, analyst: own).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Report::query()
            ->visibleTo($request->user())
            ->with('user:id,name')
            ->withCount('detections')
            ->latest();

        if ($request->filled('seedLotNo')) {
            $query->where(
                'seed_lot_no',
                'like',
                '%' . $request->input('seedLotNo') . '%'
            );
        }

        if ($request->filled('accession')) {
            $query->where(
                'accession',
                'like',
                '%' . $request->input('accession') . '%'
            );
        }

        if ($request->filled('readingDate')) {
            $query->whereDate(
                'reading_date',
                $request->input('readingDate')
            );
        }

        if ($request->filled('replicateNumber')) {
            $query->where(
                'replicate_number',
                $request->input('replicateNumber')
            );
        }

        return response()->json(
            $query->paginate(20)
        );
    }

    /**
     * Display a report together with Rep 1 and Rep 2
     * of the same seed lot (same analyst).
     */
    public function show(
        Request $request,
        Report $report
    ): JsonResponse {
        $this->authorizeAccess($request, $report);

        $report->load(['user:id,name', 'editor:id,name']);

        // Latest saved report for each replicate of this seed lot.
        $replicates = Report::query()
            ->with(['user:id,name', 'editor:id,name'])
            ->where('user_id', $report->user_id)
            ->where('seed_lot_no', $report->seed_lot_no)
            ->whereIn('replicate_number', [1, 2])
            ->orderByDesc('id')
            ->get()
            ->unique('replicate_number')
            ->keyBy('replicate_number');

        return response()->json([
            'data' => $report,

            'replicates' => [
                '1' => $replicates->get(1),
                '2' => $replicates->get(2),
            ],
        ]);
    }

    /**
     * Update the AI result counts of a report.
     */
    public function update(
        Request $request,
        Report $report
    ): JsonResponse {
        $this->authorizeAccess($request, $report);

        $validated = $request->validate([
            'normal_count' => ['required', 'integer', 'min:0', 'max:100000'],
            'abnormal_count' => ['required', 'integer', 'min:0', 'max:100000'],
            'dead_count' => ['required', 'integer', 'min:0', 'max:100000'],
        ]);

        $report->applyCounts(
            (int) $validated['normal_count'],
            (int) $validated['abnormal_count'],
            (int) $validated['dead_count']
        );

        $report->markEditedBy($request->user());
        $report->save();

        ActivityLogger::log(
            'report.updated',
            'Edited report ' . $report->seed_lot_no
                . ' (Rep ' . $report->replicate_number . ').',
            $request->user(),
            $report
        );

        return response()->json([
            'message' => 'Report updated successfully.',
            'data' => $report->fresh(['user:id,name', 'editor:id,name']),
        ]);
    }

    /**
     * Delete a report and its image.
     */
    public function destroy(
        Request $request,
        Report $report
    ): JsonResponse {
        $this->authorizeAccess($request, $report);

        if ($report->image_path) {
            Storage::disk('public')->delete($report->image_path);
        }

        $label = $report->seed_lot_no
            . ' (Rep ' . $report->replicate_number . ')';

        $report->delete();

        ActivityLogger::log(
            'report.deleted',
            'Deleted report ' . $label . '.',
            $request->user()
        );

        return response()->json([
            'message' => 'Report deleted successfully.',
        ]);
    }

    private function authorizeAccess(
        Request $request,
        Report $report
    ): void {
        abort_unless(
            $report->isAccessibleBy($request->user()),
            403,
            'You are not authorized to access this report.'
        );
    }
}