<?php

namespace App\Services;

use App\Models\Report;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class ReportService
{
    public function create(
        User $user,
        array $details,
        array $analysis,
        ?UploadedFile $image = null
    ): Report {
        return DB::transaction(function () use (
            $user,
            $details,
            $analysis,
            $image
        ) {
            $imagePath = null;

            if ($image) {
                $imagePath = $image->store('seed-tests', 'public');
            }

            $counts = $analysis['counts'] ?? [];

            $normal   = (int) ($counts['Normal'] ?? 0);
            $abnormal = (int) ($counts['Abnormal'] ?? 0);
            $dead     = (int) ($counts['Dead'] ?? 0);
            $total    = $normal + $abnormal + $dead;

            $viability = $total > 0
                ? round((($normal + $abnormal) / $total) * 100, 1)
                : 0;

            $germination = $total > 0
                ? (int) round(($normal / $total) * 100)
                : 0;

            $report = Report::create([
                'user_id' => $user->id,

                'seed_lot_no'      => $details['seedLotNo'],
                'accession'        => $details['accession'] ?? null,
                'collection_no'    => $details['collectionNo'],
                'accession_name'   => $details['accessionName'],
                'date_sown'        => $details['dateSown'],
                'reading_date'     => $details['readingDate'],
                'replicate_number' => $details['replicateNumber'],

                'normal_count'   => $normal,
                'abnormal_count' => $abnormal,
                'dead_count'     => $dead,
                'total_count'    => $total,

                'viability'             => $viability,
                'predicted_germination' => $germination,

                'image_path' => $imagePath,
            ]);

            foreach ($analysis['detections'] ?? [] as $detection) {
                $box = $detection['box'] ?? [];

                $report->detections()->create([
                    'class'      => $detection['class'] ?? 'Unknown',
                    'confidence' => $detection['confidence'] ?? 0,
                    'x1'         => $box[0] ?? 0,
                    'y1'         => $box[1] ?? 0,
                    'x2'         => $box[2] ?? 0,
                    'y2'         => $box[3] ?? 0,
                ]);
            }

            return $report->load('detections');
        });
    }
}