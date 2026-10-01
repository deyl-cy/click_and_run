<?php

namespace App\Http\Controllers;

use App\Exports\ReportExport;
use App\Models\Report;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class ReportExportController extends Controller
{
    public function pdf(Request $request, Report $report)
    {
        abort_unless(
            $report->user_id === $request->user()->id,
            403,
            'You are not authorized to export this report.'
        );

        $report->load(['user:id,name', 'detections']);

        $pdf = Pdf::loadView('reports', ['report' => $report]);

        return $pdf->download(
            'seed-analysis-report-' . $report->id . '.pdf'
        );
    }

    public function excel(Request $request, Report $report)
    {
        abort_unless(
            $report->user_id === $request->user()->id,
            403,
            'You are not authorized to export this report.'
        );

        $report->load(['user:id,name', 'detections']);

        return Excel::download(
            new ReportExport($report),
            'seed-analysis-report-' . $report->id . '.xlsx'
        );
    }
}