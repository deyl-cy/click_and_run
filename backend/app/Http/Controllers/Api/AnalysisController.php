<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ReportService;
use App\Services\SeedAnalysisService;
use App\Services\SeedResultService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class AnalysisController extends Controller
{
    public function __construct(
        private SeedAnalysisService $analysisService,
        private SeedResultService $resultService,
        private ReportService $reportService
    ) {
    }

    public function analyze(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'image' => [
                'required',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:15360',
            ],

            'seedLotNo' => [
                'required',
                'string',
                'max:255',
            ],

            'accession' => [
                'nullable',
                'string',
                'max:255',
            ],

            'collectionNo' => [
                'required',
                'string',
                'max:255',
            ],

            'accessionName' => [
                'required',
                'string',
                'max:255',
            ],

            'dateSown' => [
                'required',
                'date',
            ],

            'readingDate' => [
                'required',
                'date',
            ],

            'replicateNumber' => [
                'required',
                'integer',
                'in:1,2',
            ],

            'confidence' => [
                'nullable',
                'numeric',
                'between:0,1',
            ],
        ]);

        try {
            $raw = $this->analysisService->analyze(
                $request->file('image'),
                isset($validated['confidence'])
                    ? (float) $validated['confidence']
                    : null
            );

            if (
                empty($raw['detections']) ||
                count($raw['detections']) === 0
            ) {
                return response()->json([
                    'message' =>
                        'No seedlings were detected in this image. ' .
                        'Try a clearer photo.',
                ], 422);
            }

            $result = $this->resultService->build($raw);

            return response()->json([
                'message' => 'Analysis completed.',

                'data' => [
                    'details' => [
                        'seedLotNo' =>
                            $validated['seedLotNo'],

                        'accession' =>
                            $validated['accession'] ?? '',

                        'collectionNo' =>
                            $validated['collectionNo'],

                        'accessionName' =>
                            $validated['accessionName'],

                        'dateSown' =>
                            $validated['dateSown'],

                        'readingDate' =>
                            $validated['readingDate'],

                        'replicateNumber' =>
                            (int) $validated['replicateNumber'],
                    ],

                    'analysis' => $result,
                ],
            ]);
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'message' =>
                    'Analysis failed: ' .
                    $exception->getMessage(),
            ], 502);
        }
    }

    public function save(
        Request $request
    ): JsonResponse {
        // Step 49: Convert JSON strings from FormData
        // into PHP arrays before validation.

        if ($request->has('details')) {
            $request->merge([
                'details' => json_decode(
                    $request->input('details'),
                    true
                ),
            ]);
        }

        if ($request->has('analysis')) {
            $request->merge([
                'analysis' => json_decode(
                    $request->input('analysis'),
                    true
                ),
            ]);
        }

        // Step 48/46: Validate the request
        $validated = $request->validate([
            'details' => [
                'required',
                'array',
            ],

            'details.seedLotNo' => [
                'required',
                'string',
                'max:255',
            ],

            'details.accession' => [
                'nullable',
                'string',
                'max:255',
            ],

            'details.collectionNo' => [
                'required',
                'string',
                'max:255',
            ],

            'details.accessionName' => [
                'required',
                'string',
                'max:255',
            ],

            'details.dateSown' => [
                'required',
                'date',
            ],

            'details.readingDate' => [
                'required',
                'date',
            ],

            'details.replicateNumber' => [
                'required',
                'integer',
                'in:1,2',
            ],

            'analysis' => [
                'required',
                'array',
            ],

            'analysis.counts' => [
                'required',
                'array',
            ],

            'analysis.detections' => [
                'required',
                'array',
            ],

            'image' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:10240',
            ],
        ]);

        try {
            $report = $this->reportService->create(
                $request->user(),
                $validated['details'],
                $validated['analysis'],
                $request->file('image')
            );

            return response()->json([
                'message' => 'Report saved successfully.',
                'data' => $report,
            ], 201);

        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'message' => 'Unable to save the report.',
            ], 500);
        }
    }
}