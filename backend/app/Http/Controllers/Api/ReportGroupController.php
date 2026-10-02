<?php

namespace App\Http\Controllers\Api;

use App\Exports\ReportSummaryExport;
use App\Http\Controllers\Controller;
use App\Services\ReportGroupService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class ReportGroupController extends Controller
{
    public function __construct(
        private ReportGroupService $service
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $groups = $this->service->groups(
            $request->user(),
            $this->filters($request)
        );

        return response()->json([
            'data' => $groups,
            'meta' => $this->service->summary($groups),
        ]);
    }

    public function pdf(Request $request)
    {
        $filters = $this->filters($request);
        $groups = $this->service->groups($request->user(), $filters);

        $pdf = Pdf::loadView('report-summary', [
            'groups' => $groups,
            'summary' => $this->service->summary($groups),
            'filterText' => $this->service->describeFilters($filters),
            'generatedAt' => now()->format('n/j/Y'),
        ])->setPaper('a4', 'landscape');

        return $pdf->download(
            'seed-test-reports-' . now()->format('Y-m-d') . '.pdf'
        );
    }

    public function excel(Request $request)
    {
        $filters = $this->filters($request);
        $groups = $this->service->groups($request->user(), $filters);

        return Excel::download(
            new ReportSummaryExport(
                $groups,
                $this->service->summary($groups),
                $this->service->describeFilters($filters),
                now()->format('n/j/Y')
            ),
            'seed-test-reports-' . now()->format('Y-m-d') . '.xlsx'
        );
    }

    private function filters(Request $request): array
    {
        return $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'dateField' => ['nullable', 'in:sown,reading'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
            'sort' => ['nullable', 'in:newest,oldest,name,viability'],
        ]);
    }
}