<?php

namespace App\Services;

class SeedResultService
{
    private const SEEDLING_TYPES = [
        'Normal',
        'Abnormal',
        'Dead',
    ];

    private const SHOOT_BY_TYPE = [
        'Normal' => 'Intact',
        'Abnormal' => 'Weak',
        'Dead' => 'Absent',
    ];

    private const ROOT_BY_TYPE = [
        'Normal' => 'Intact',
        'Abnormal' => 'Present',
        'Dead' => 'Absent',
    ];

    private const SECONDARY_BY_TYPE = [
        'Normal' => 'Intact',
        'Abnormal' => 'Partial',
        'Dead' => 'None',
    ];

    public function build(array $raw): array
    {
        $counts = [
            'Normal' => 0,
            'Abnormal' => 0,
            'Dead' => 0,
        ];

        $detections = $raw['detections'] ?? [];

        foreach ($detections as $detection) {
            $label = $detection['class'] ?? null;

            if (
                $label !== null &&
                in_array(
                    $label,
                    self::SEEDLING_TYPES,
                    true
                )
            ) {
                $counts[$label]++;
            }
        }

        $total = count($detections);

        /*
         * Preserve the original application's viability
         * calculation:
         *
         * Normal + Abnormal
         * ------------------ × 100
         *       Total
         */
        $viableCount =
            $counts['Normal'] +
            $counts['Abnormal'];

        $viability = $total > 0
            ? round(
                ($viableCount / $total) * 100,
                1
            )
            : 0;

        /*
         * Preserve the original germination calculation:
         *
         * Normal / Total × 100
         */
        $predictedGermination = $total > 0
            ? (int) round(
                ($counts['Normal'] / $total) * 100
            )
            : 0;

        $seedDetails = array_map(
            function (array $detection): array {
                $type = $detection['class'] ?? '';

                return [
                    $type,
                    self::SHOOT_BY_TYPE[$type] ?? '-',
                    self::ROOT_BY_TYPE[$type] ?? '-',
                    self::SECONDARY_BY_TYPE[$type] ?? '-',
                ];
            },
            $detections
        );

        return [
            'counts' => $counts,
            'total' => $total,
            'viability' => $viability,
            'predictedGermination' => $predictedGermination,
            'seedDetails' => $seedDetails,
            'detections' => $detections,
            'imageWidth' => $raw['imageWidth'] ?? null,
            'imageHeight' => $raw['imageHeight'] ?? null,
            'confidenceUsed' => $raw['confidenceUsed'] ?? null,
        ];
    }
}