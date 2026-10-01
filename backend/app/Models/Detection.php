<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Detection extends Model
{
    protected $fillable = [
        'report_id',
        'class',
        'confidence',
        'x1',
        'y1',
        'x2',
        'y2',
    ];

    protected $casts = [
        'confidence' => 'float',
        'x1' => 'float',
        'y1' => 'float',
        'x2' => 'float',
        'y2' => 'float',
    ];

    public function report(): BelongsTo
    {
        return $this->belongsTo(Report::class);
    }
}