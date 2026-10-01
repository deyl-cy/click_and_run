<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Report extends Model
{
    protected $fillable = [
        'user_id',
        'seed_lot_no',
        'accession',
        'collection_no',
        'accession_name',
        'date_sown',
        'reading_date',
        'replicate_number',
        'normal_count',
        'abnormal_count',
        'dead_count',
        'total_count',
        'viability',
        'predicted_germination',
        'image_path',
    ];

    protected $appends = [
        'image_url',
    ];

    protected $casts = [
        'date_sown' => 'date',
        'reading_date' => 'date',
        'viability' => 'decimal:1',
        'predicted_germination' => 'integer',
        'replicate_number' => 'integer',
    ];

    public function getImageUrlAttribute(): ?string
    {
        if (!$this->image_path) {
            return null;
        }

        return asset(
            'storage/' . $this->image_path
        );
    }

    /**
     * Set the counts and recompute total, viability
     * and germination from them.
     */
    public function applyCounts(
        int $normal,
        int $abnormal,
        int $dead
    ): void {
        $total = $normal + $abnormal + $dead;

        $this->normal_count = $normal;
        $this->abnormal_count = $abnormal;
        $this->dead_count = $dead;
        $this->total_count = $total;

        $this->viability = $total > 0
            ? round((($normal + $abnormal) / $total) * 100, 1)
            : 0;

        $this->predicted_germination = $total > 0
            ? (int) round(($normal / $total) * 100)
            : 0;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function detections(): HasMany
    {
        return $this->hasMany(Detection::class);
    }
}