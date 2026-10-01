<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">

    <title>Seed Analysis Report #{{ $report->id }}</title>

    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 12px;
            color: #1f2937;
            margin: 30px;
        }

        h1 {
            font-size: 22px;
            margin-bottom: 4px;
        }

        h2 {
            font-size: 16px;
            margin-top: 24px;
            margin-bottom: 10px;
            border-bottom: 1px solid #d1d5db;
            padding-bottom: 5px;
        }

        .subtitle {
            color: #6b7280;
            margin-bottom: 20px;
        }

        .info-table,
        .results-table {
            width: 100%;
            border-collapse: collapse;
        }

        .info-table td {
            padding: 7px;
            border: 1px solid #e5e7eb;
        }

        .info-label {
            width: 35%;
            font-weight: bold;
            background: #f3f4f6;
        }

        .results-table th,
        .results-table td {
            padding: 7px;
            border: 1px solid #d1d5db;
            text-align: left;
        }

        .results-table th {
            background: #f3f4f6;
        }

        .metric {
            display: inline-block;
            width: 30%;
            margin-right: 2%;
            padding: 12px;
            border: 1px solid #d1d5db;
            text-align: center;
        }

        .metric:last-child {
            margin-right: 0;
        }

        .metric-title {
            font-size: 10px;
            color: #6b7280;
        }

        .metric-value {
            font-size: 20px;
            font-weight: bold;
            margin-top: 5px;
        }

        .footer {
            margin-top: 30px;
            font-size: 10px;
            color: #6b7280;
            text-align: center;
        }
    </style>
</head>

<body>

    <h1>Rice Seed Analysis Report</h1>

    <div class="subtitle">
        Report #{{ $report->id }}
    </div>

    <h2>Seed Information</h2>

    <table class="info-table">
        <tr>
            <td class="info-label">Seed Lot No.</td>
            <td>{{ $report->seed_lot_no }}</td>
        </tr>

        <tr>
            <td class="info-label">Accession</td>
            <td>{{ $report->accession ?: '—' }}</td>
        </tr>

        <tr>
            <td class="info-label">Collection No.</td>
            <td>{{ $report->collection_no }}</td>
        </tr>

        <tr>
            <td class="info-label">Accession Name</td>
            <td>{{ $report->accession_name }}</td>
        </tr>

        <tr>
            <td class="info-label">Date Sown</td>
            <td>{{ $report->date_sown }}</td>
        </tr>

        <tr>
            <td class="info-label">Reading Date</td>
            <td>{{ $report->reading_date }}</td>
        </tr>

        <tr>
            <td class="info-label">Replicate</td>
            <td>{{ $report->replicate_number }}</td>
        </tr>
    </table>

    <h2>Analysis Summary</h2>

    <table class="results-table">
        <thead>
            <tr>
                <th>Normal</th>
                <th>Abnormal</th>
                <th>Dead</th>
                <th>Total</th>
            </tr>
        </thead>

        <tbody>
            <tr>
                <td>{{ $report->normal_count }}</td>
                <td>{{ $report->abnormal_count }}</td>
                <td>{{ $report->dead_count }}</td>
                <td>{{ $report->total_count }}</td>
            </tr>
        </tbody>
    </table>

    <h2>Test Results</h2>

    <div>
        <div class="metric">
            <div class="metric-title">
                Viability
            </div>

            <div class="metric-value">
                {{ $report->viability }}%
            </div>
        </div>

        <div class="metric">
            <div class="metric-title">
                Predicted Germination
            </div>

            <div class="metric-value">
                {{ $report->predicted_germination }}%
            </div>
        </div>

        <div class="metric">
            <div class="metric-title">
                Detections
            </div>

            <div class="metric-value">
                {{ $report->detections->count() }}
            </div>
        </div>
    </div>

    <h2>YOLO Detections</h2>

    @if ($report->detections->count() > 0)

        <table class="results-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Class</th>
                    <th>Confidence</th>
                    <th>X1</th>
                    <th>Y1</th>
                    <th>X2</th>
                    <th>Y2</th>
                </tr>
            </thead>

            <tbody>
                @foreach ($report->detections as $index => $detection)
                    <tr>
                        <td>{{ $index + 1 }}</td>

                        <td>
                            {{ $detection->class }}
                        </td>

                        <td>
                            {{ number_format($detection->confidence * 100, 1) }}%
                        </td>

                        <td>
                            {{ number_format($detection->x1, 1) }}
                        </td>

                        <td>
                            {{ number_format($detection->y1, 1) }}
                        </td>

                        <td>
                            {{ number_format($detection->x2, 1) }}
                        </td>

                        <td>
                            {{ number_format($detection->y2, 1) }}
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>

    @else

        <p>No detections recorded.</p>

    @endif

    <div class="footer">
        Rice Seed Analysis System
    </div>

</body>
</html>