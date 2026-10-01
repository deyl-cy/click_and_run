<?php

namespace App\Exports;

use App\Models\Report;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ReportDetectionsSheet implements
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
        $rows = [
            ['YOLO DETECTIONS'],
            [],
            ['#', 'Class', 'Confidence', 'X1', 'Y1', 'X2', 'Y2'],
        ];

        foreach ($this->report->detections as $index => $detection) {
            $rows[] = [
                $index + 1,
                $detection->class,
                (float) $detection->confidence,
                (float) $detection->x1,
                (float) $detection->y1,
                (float) $detection->x2,
                (float) $detection->y2,
            ];
        }

        return $rows;
    }

    public function title(): string
    {
        return 'Detections';
    }

    public function styles(Worksheet $sheet): ?array
    {
        $sheet->getStyle('A1:G1')->getFont()->setBold(true)->setSize(18);
        $sheet->getStyle('A3:G3')->getFont()->setBold(true);

        $lastRow = 3 + $this->report->detections->count();

        $sheet->getStyle("A3:G{$lastRow}")
            ->getBorders()
            ->getAllBorders()
            ->setBorderStyle(Border::BORDER_THIN);

        if ($lastRow >= 4) {
            $sheet->getStyle("C4:C{$lastRow}")
                ->getNumberFormat()
                ->setFormatCode('0.0%');

            $sheet->getStyle("D4:G{$lastRow}")
                ->getNumberFormat()
                ->setFormatCode('0.0');
        }

        $sheet->freezePane('A4');

        return [];
    }
}