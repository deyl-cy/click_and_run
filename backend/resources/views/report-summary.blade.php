@php
    $pct = fn ($value) => rtrim(rtrim(number_format((float) $value, 1), '0'), '.') . '%';
    $cols = ($showAnalyst ?? false) ? 17 : 16;
@endphp
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Seed Test Reports</title>
    <style>
        @page { margin: 28px 30px; }

        body {
            font-family: Helvetica, Arial, sans-serif;
            color: #1f2937;
            font-size: 8px;
        }

        table.head { width: 100%; border-collapse: collapse; }
        table.head td { padding: 0; vertical-align: top; }

        .title { font-size: 13px; font-weight: bold; }
        .generated { text-align: right; font-size: 8px; color: #6b7280; }
        .subtitle { margin-top: 6px; font-size: 8px; color: #4b5563; }

        table.data {
            width: 100%;
            border-collapse: collapse;
            margin-top: 22px;
        }

        table.data th {
            background: #274e37;
            color: #ffffff;
            font-size: 7px;
            text-align: left;
            text-transform: uppercase;
            padding: 6px 5px;
        }

        table.data td {
            font-size: 7.5px;
            color: #374151;
            padding: 6px 5px;
        }

        table.data tr.alt td { background: #f3f5f3; }
        .empty { text-align: center; padding: 18px 0; color: #6b7280; }
    </style>
</head>
<body>

    <table class="head">
        <tr>
            <td class="title">PHILRICE GENEBANK | SEED GERMINATION TESTING</td>
            <td class="generated">Generated {{ $generatedAt }}</td>
        </tr>
    </table>

    <div class="subtitle">
        {{ $summary['test_reports'] }} test reports,
        {{ $summary['accessions'] }} accessions | {{ $filterText }}
    </div>

    <table class="data">
        <thead>
            <tr>
                <th rowspan="2">No.</th>
                <th rowspan="2">2SDS Lot No.</th>
                <th rowspan="2">Accession No.</th>
                <th rowspan="2">Collection No.</th>
                <th rowspan="2">Accession Name</th>
                <th colspan="2">Date</th>
                <th colspan="3">Rep 1</th>
                <th colspan="3">Rep 2</th>
                <th rowspan="2">% VA</th>
                <th rowspan="2">No. of Seeds Tested</th>
                <th rowspan="2">Remarks</th>
                @if ($showAnalyst ?? false)
                    <th rowspan="2">Tested By</th>
                @endif
            </tr>
            <tr>
                <th>Sowing</th>
                <th>Reading</th>
                <th>Normal</th>
                <th>AB</th>
                <th>Dead</th>
                <th>Normal</th>
                <th>AB</th>
                <th>Dead</th>
            </tr>
        </thead>

        <tbody>
            @forelse ($groups as $index => $group)
                <tr class="{{ $index % 2 ? 'alt' : '' }}">
                    <td>{{ $index + 1 }}</td>
                    <td>{{ $group['seed_lot_no'] }}</td>
                    <td>{{ $group['accession'] }}</td>
                    <td>{{ $group['collection_no'] }}</td>
                    <td>{{ $group['accession_name'] }}</td>
                    <td>{{ $group['date_sown'] }}</td>
                    <td>{{ $group['reading_date'] }}</td>

                    @foreach (['1', '2'] as $number)
                        @php $rep = $group['reps'][$number] ?? null; @endphp
                        <td>{{ $rep['normal_count'] ?? '' }}</td>
                        <td>{{ $rep['abnormal_count'] ?? '' }}</td>
                        <td>{{ $rep['dead_count'] ?? '' }}</td>
                    @endforeach

                    <td>{{ $pct($group['viability']) }}</td>
                    <td>{{ $group['total_seeds'] }}</td>
                    <td></td>
                    @if ($showAnalyst ?? false)
                        <td>{{ $group['tested_by'] ?? '' }}</td>
                    @endif
                </tr>
            @empty
                <tr>
                    <td colspan="{{ $cols }}" class="empty">No test reports found.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

</body>
</html>