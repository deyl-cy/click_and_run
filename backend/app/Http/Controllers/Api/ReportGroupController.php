<?php

namespace App\Http\Controllers\Api;

use App\Exports\ReportSummaryExport;
use App\Http\Controllers\Controller;
use App\Models\User;
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
        $filters = $this->filters($request);

        $paging = $request->validate([
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $perPage = (int) ($paging['per_page'] ?? 10);

        $groups = $this->service->groups($request->user(), $filters);

        $total = $groups->count();
        $lastPage = max(1, (int) ceil($total / $perPage));
        $page = min(max(1, (int) ($paging['page'] ?? 1)), $lastPage);

        $meta = $this->service->summary($groups) + [
            'total' => $total,
            'current_page' => $page,
            'last_page' => $lastPage,
            'per_page' => $perPage,
        ];

        // Admin gets the list of people for the "Tested by" filter.
        if ($request->user()->isAdmin()) {
            $meta['analysts'] = User::query()
                ->orderBy('name')
                ->get(['id', 'name']);
        }

        return response()->json([
            'data' => $groups->forPage($page, $perPage)->values(),
            'meta' => $meta,
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
            'showAnalyst' => $request->user()->isAdmin(),
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
                now()->format('n/j/Y'),
                $request->user()->isAdmin()
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
            'analyst' => ['nullable', 'integer'],
        ]);
    }
}