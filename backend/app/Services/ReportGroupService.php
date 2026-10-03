<?php

namespace App\Services;

use App\Models\Report;
use App\Models\User;
use Illuminate\Support\Collection;

class ReportGroupService
{
    /**
     * One entry per seed lot (accession) per analyst,
     * with Rep 1 and Rep 2.
     *
     * Admin: every analyst's reports (optionally one analyst).
     * Analyst: only their own.
     */
    public function groups(User $user, array $filters = []): Collection
    {
        $dateColumn = ($filters['dateField'] ?? 'sown') === 'reading'
            ? 'reading_date'
            : 'date_sown';

        $search = $filters['search'] ?? null;
        $from = $filters['from'] ?? null;
        $to = $filters['to'] ?? null;
        $analyst = $filters['analyst'] ?? null;

        // Seed lots that match the filters (exact, SQL distinct).
        $matching = Report::query()
            ->visibleTo($user)
            ->when(
                $user->isAdmin() && $analyst,
                fn ($query) => $query->where('user_id', $analyst)
            )
            ->when($search, function ($query) use ($search) {
                $like = '%' . $search . '%';

                $query->where(function ($inner) use ($like) {
                    $inner->where('seed_lot_no', 'like', $like)
                        ->orWhere('accession', 'like', $like)
                        ->orWhere('collection_no', 'like', $like)
                        ->orWhere('accession_name', 'like', $like);
                });
            })
            ->when($from, fn ($query) => $query->whereDate($dateColumn, '>=', $from))
            ->when($to, fn ($query) => $query->whereDate($dateColumn, '<=', $to))
            ->distinct()
            ->get(['user_id', 'seed_lot_no']);

        if ($matching->isEmpty()) {
            return collect();
        }

        $wanted = $matching
            ->map(fn ($row) => $row->user_id . '|' . $row->seed_lot_no)
            ->flip();

        // Load every replicate of those lots (newest first).
        $groups = Report::query()
            ->with('user:id,name')
            ->whereIn('user_id', $matching->pluck('user_id')->unique())
            ->whereIn('seed_lot_no', $matching->pluck('seed_lot_no')->unique())
            ->orderByDesc('id')
            ->get()
            ->filter(fn (Report $report) => $wanted->has(
                $report->user_id . '|' . $report->seed_lot_no
            ))
            ->groupBy(fn (Report $report) => $report->user_id . '|' . $report->seed_lot_no)
            ->map(fn (Collection $reports) => $this->buildGroup($reports))
            ->values();

        return $this->sort($groups, $filters['sort'] ?? 'newest');
    }

    public function summary(Collection $groups): array
    {
        return [
            'test_reports' => $groups->sum(
                fn ($group) => collect($group['reps'])->filter()->count()
            ),
            'accessions' => $groups->count(),
        ];
    }

    public function describeFilters(array $filters): string
    {
        $parts = [];

        if (!empty($filters['search'])) {
            $parts[] = 'search "' . $filters['search'] . '"';
        }

        if (!empty($filters['analyst'])) {
            $name = User::whereKey($filters['analyst'])->value('name');

            if ($name) {
                $parts[] = 'tested by ' . $name;
            }
        }

        $field = ($filters['dateField'] ?? 'sown') === 'reading'
            ? 'reading date'
            : 'sowing date';

        $from = $filters['from'] ?? null;
        $to = $filters['to'] ?? null;

        if ($from && $to) {
            $parts[] = "{$field} {$from} to {$to}";
        } elseif ($from) {
            $parts[] = "{$field} from {$from}";
        } elseif ($to) {
            $parts[] = "{$field} until {$to}";
        }

        return $parts ? implode(', ', $parts) : 'no filters';
    }

    private function buildGroup(Collection $reports): array
    {
        // Newest first, so the first one per replicate is the latest.
        $byRep = $reports
            ->whereIn('replicate_number', [1, 2])
            ->unique('replicate_number')
            ->keyBy('replicate_number');

        $rep1 = $byRep->get(1);
        $rep2 = $byRep->get(2);
        $base = $rep1 ?? $rep2 ?? $reports->first();

        $normal = (int) $byRep->sum('normal_count');
        $abnormal = (int) $byRep->sum('abnormal_count');
        $dead = (int) $byRep->sum('dead_count');
        $total = $normal + $abnormal + $dead;

        return [
            'key' => $base->user_id . '-' . $base->seed_lot_no,
            'id' => $base->id,
            'latest_id' => (int) $reports->max('id'),

            'user_id' => $base->user_id,
            'tested_by' => $base->user?->name,

            'seed_lot_no' => $base->seed_lot_no,
            'accession' => $base->accession,
            'collection_no' => $base->collection_no,
            'accession_name' => $base->accession_name,
            'date_sown' => $base->date_sown?->format('Y-m-d'),
            'reading_date' => $base->reading_date?->format('Y-m-d'),
            'image_url' => $rep1?->image_url ?? $rep2?->image_url,

            'reps' => [
                '1' => $this->repData($rep1),
                '2' => $this->repData($rep2),
            ],

            'total_seeds' => $total,
            'viability' => $total > 0
                ? round((($normal + $abnormal) / $total) * 100, 1)
                : 0,
        ];
    }

    private function repData(?Report $report): ?array
    {
        if (!$report) {
            return null;
        }

        return [
            'id' => $report->id,
            'normal_count' => (int) $report->normal_count,
            'abnormal_count' => (int) $report->abnormal_count,
            'dead_count' => (int) $report->dead_count,
            'total_count' => (int) $report->total_count,
            'viability' => (float) $report->viability,
            'predicted_germination' => (int) $report->predicted_germination,
        ];
    }

    private function sort(Collection $groups, string $sort): Collection
    {
        return match ($sort) {
            'oldest' => $groups->sortBy('latest_id')->values(),
            'name' => $groups->sortBy(
                fn ($group) => mb_strtolower((string) $group['accession_name'])
            )->values(),
            'viability' => $groups->sortByDesc('viability')->values(),
            default => $groups->sortByDesc('latest_id')->values(),
        };
    }
}