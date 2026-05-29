<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SyncLog extends Model
{
    protected $fillable = [
        'ran_at',
        'rows_fetched',
        'rows_upserted',
        'status',
        'error_message',
        'duration_ms',
    ];

    protected $casts = [
        'ran_at' => 'datetime',
    ];
}
