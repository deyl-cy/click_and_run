<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class SeedAnalysisService
{
    public function analyze(
        UploadedFile $image,
        ?float $confidence = null
    ): array {
        $pythonUrl = config('services.seed_analysis.url');

        if (!$pythonUrl) {
            throw new RuntimeException(
                'Seed analysis service URL is not configured.'
            );
        }

        $request = Http::timeout(120);

        $multipart = [
            [
                'name' => 'image',
                'contents' => fopen(
                    $image->getRealPath(),
                    'r'
                ),
                'filename' => $image->getClientOriginalName(),
            ],
        ];

        if ($confidence !== null) {
            $multipart[] = [
                'name' => 'confidence',
                'contents' => (string) $confidence,
            ];
        }

        $response = $request
            ->asMultipart()
            ->post($pythonUrl . '/analyze', $multipart);

        if ($response->failed()) {
            $detail = $response->json('detail');

            throw new RuntimeException(
                $detail ?: 'The seed analysis service returned an error.'
            );
        }

        return $response->json();
    }
}