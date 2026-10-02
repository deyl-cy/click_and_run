<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithCustomValueBinder;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Cell\Cell;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Cell\DefaultValueBinder;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ReportSummaryExport extends DefaultValueBinder implements
    FromArray,
    WithColumnWidths,
    WithCustomValueBinder,
    WithStyles,
    WithTitle
{
    private const FIRST_DATA_ROW = 6;

    public function __construct(
        private Collection $groups,
        private array $summary,
        private string $filterText,
        private string $generatedAt
    ) {
    }

    public function array(): array
    {
        $title = array_fill(0, 16, null);
        $title[0] = 'PHILRICE GENEBANK | SEED GERMINATION TESTING';
        $title[15] = 'Generated ' . $this->generatedAt;

        $subtitle = array_fill(0, 16, null);
        $subtitle[0] = $this->summary['test_reports'] . ' test reports, '
            . $this->summary['accessions'] . ' accessions | '
            . $this->filterText;

        $rows = [
            $title,
            $subtitle,
            [],
            [
                'NO.', '2SDS LOT NO.', 'ACCESSION NO.', 'COLLECTION NO.',
                'ACCESSION NAME', 'DATE', null, 'REP 1', null, null,
                'REP 2', null, null, '% VA', 'NO. OF SEEDS TESTED', 'REMARKS',
            ],
            [
                null, null, null, null, null, 'SOWING', 'READING',
                'NORMAL', 'AB', 'DEAD', 'NORMAL', 'AB', 'DEAD',
                null, null, null,
            ],
        ];

        foreach ($this->groups->values() as $index => $group) {
            $rep1 = $group['reps']['1'] ?? null;
            $rep2 = $group['reps']['2'] ?? null;

            $rows[] = [
                $index + 1,
                $group['seed_lot_no'],
                $group['accession'],
                $group['collection_no'],
                $group['accession_name'],
                $group['date_sown'],
                $group['reading_date'],
                $rep1['normal_count'] ?? null,
                $rep1['abnormal_count'] ?? null,
                $rep1['dead_count'] ?? null,
                $rep2['normal_count'] ?? null,
                $rep2['abnormal_count'] ?? null,
                $rep2['dead_count'] ?? null,
                ((float) $group['viability']) / 100,
                $group['total_seeds'],
                null,
            ];
        }

        return $rows;
    }

    public function title(): string
    {
        return 'Test Reports';
    }

    public function columnWidths(): array
    {
        return [
            'A' => 6,  'B' => 16, 'C' => 16, 'D' => 16, 'E' => 24,
            'F' => 12, 'G' => 12,
            'H' => 9,  'I' => 7,  'J' => 7,
            'K' => 9,  'L' => 7,  'M' => 7,
            'N' => 10, 'O' => 14, 'P' => 24,
        ];
    }

    /**
     * Keep lot / accession / collection / name as text so
     * values like "003" don't lose their leading zeros.
     */
    public function bindValue(Cell $cell, mixed $value): bool
    {
        if (
            $value !== null &&
            $cell->getRow() >= self::FIRST_DATA_ROW &&
            in_array($cell->getColumn(), ['B', 'C', 'D', 'E'], true)
        ) {
            $cell->setValueExplicit((string) $value, DataType::TYPE_STRING);

            return true;
        }

        return parent::bindValue($cell, $value);
    }

    public function styles(Worksheet $sheet): ?array
    {
        $first = self::FIRST_DATA_ROW;
        $last = 5 + $this->groups->count();

        // Title block
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
        $sheet->getStyle('P1')->getFont()->setSize(9)->getColor()->setRGB('6B7280');
        $sheet->getStyle('P1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        $sheet->getStyle('A2')->getFont()->setSize(9)->getColor()->setRGB('6B7280');

        // Two-row header
        foreach (['A', 'B', 'C', 'D', 'E', 'N', 'O', 'P'] as $column) {
            $sheet->mergeCells("{$column}4:{$column}5");
        }

        $sheet->mergeCells('F4:G4');
        $sheet->mergeCells('H4:J4');
        $sheet->mergeCells('K4:M4');

        $header = $sheet->getStyle('A4:P5');
        $header->getFont()->setBold(true)->setSize(9)->getColor()->setRGB('FFFFFF');
        $header->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('274E37');
        $header->getAlignment()
            ->setVertical(Alignment::VERTICAL_CENTER)
            ->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // Data rows
        if ($last >= $first) {
            for ($row = $first; $row <= $last; $row++) {
                if (($row - $first) % 2 === 1) {
                    $sheet->getStyle("A{$row}:P{$row}")
                        ->getFill()
                        ->setFillType(Fill::FILL_SOLID)
                        ->getStartColor()
                        ->setRGB('F3F5F3');
                }
            }

            $sheet->getStyle("A{$first}:A{$last}")
                ->getAlignment()
                ->setHorizontal(Alignment::HORIZONTAL_CENTER);

            $sheet->getStyle("F{$first}:O{$last}")
                ->getAlignment()
                ->setHorizontal(Alignment::HORIZONTAL_CENTER);

            $sheet->getStyle("N{$first}:N{$last}")
                ->getNumberFormat()
                ->setFormatCode('0.0%');
        }

        $sheet->freezePane('A6');

        return [];
    }
}