<?php

namespace App\Exports;

use App\Models\Report;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ReportSummarySheet implements
    FromArray,
    WithStyles,
    WithTitle,
    ShouldAutoSize
{
    public function __construct(
        protected Report $report
    ) {
    }

    public function array(): array
    {
        $r = $this->report;

        return [
            ['RICE SEED ANALYSIS REPORT'],                                   // 1
            ['Report ID', $r->id],                                           // 2
            [],                                                              // 3
            ['SEED INFORMATION'],                                            // 4
            ['Seed Lot No.', $r->seed_lot_no],                               // 5
            ['Accession', $r->accession ?: '-'],                             // 6
            ['Collection No.', $r->collection_no],                           // 7
            ['Accession Name', $r->accession_name],                          // 8
            ['Date Sown', $r->date_sown?->format('Y-m-d')],                  // 9
            ['Reading Date', $r->reading_date?->format('Y-m-d')],           // 10
            ['Replicate', $r->replicate_number],                             // 11
            [],                                                              // 12
            ['ANALYSIS SUMMARY'],                                            // 13
            ['Normal', (int) $r->normal_count],                              // 14
            ['Abnormal', (int) $r->abnormal_count],                          // 15
            ['Dead', (int) $r->dead_count],                                  // 16
            ['Total', (int) $r->total_count],                                // 17
            [],                                                              // 18
            ['TEST RESULTS'],                                                // 19
            ['Viability', ((float) $r->viability) / 100],                    // 20
            ['Predicted Germination', ((float) $r->predicted_germination) / 100], // 21
            ['Total Detections', $r->detections->count()],                   // 22
            [],                                                              // 23
            ['REPORT INFORMATION'],                                          // 24
            ['Generated At', now()->format('Y-m-d H:i:s')],                  // 25
        ];
    }

    public function title(): string
    {
        return 'Report Summary';
    }

    public function styles(Worksheet $sheet): ?array
    {
        $sheet->getStyle('A1:B1')->getFont()->setBold(true)->setSize(18);

        foreach ([4, 13, 19, 24] as $row) {
            $sheet->getStyle("A{$row}:B{$row}")->getFont()->setBold(true);
        }

        $sheet->getStyle('A1:B25')
            ->getAlignment()
            ->setVertical(Alignment::VERTICAL_CENTER);

        $sheet->getStyle('B1:B25')
            ->getAlignment()
            ->setHorizontal(Alignment::HORIZONTAL_LEFT);

        $sheet->getStyle('A1:B25')
            ->getBorders()
            ->getAllBorders()
            ->setBorderStyle(Border::BORDER_THIN);

        $sheet->getStyle('B20:B21')
            ->getNumberFormat()
            ->setFormatCode('0.0%');

        return [];
    }
}