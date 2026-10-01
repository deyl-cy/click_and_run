<?php

namespace App\Exports;

use App\Models\Report;
use Maatwebsite\Excel\Concerns\Export;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class ReportExport implements Export, WithMultipleSheets
{
    public function __construct(
        protected Report $report
    ) {
    }

    public function sheets(): array
    {
        return [
            new ReportSummarySheet($this->report),
            new ReportDetectionsSheet($this->report),
        ];
    }
}