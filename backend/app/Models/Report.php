<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
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
        'last_edited_by',
        'last_edited_at',
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
        'last_edited_at' => 'datetime',
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
     * Reports the given user is allowed to see:
     * admins see everything, analysts only their own.
     */
    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        return $user->isAdmin()
            ? $query
            : $query->where('user_id', $user->id);
    }

    /**
     * Owner or admin.
     */
    public function isAccessibleBy(User $user): bool
    {
        return $user->isAdmin() || $this->user_id === $user->id;
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

    /**
     * Record who edited the AI results, and when.
     */
    public function markEditedBy(User $user): void
    {
        $this->last_edited_by = $user->id;
        $this->last_edited_at = now();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function editor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'last_edited_by');
    }

    public function detections(): HasMany
    {
        return $this->hasMany(Detection::class);
    }
}