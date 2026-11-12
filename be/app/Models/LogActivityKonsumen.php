<?php

namespace App\Models;

use App\Enums\LogKonsumenAction;
use App\Enums\StatusKonsumen;
use App\Enums\TypeTempKonsumen;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LogActivityKonsumen extends Model
{
    protected $table = 'log.log_activity_konsumens';

    public $timestamps = false;

    protected $fillable = [
        'action',
        'fk_konsumen',
        'fk_temp_konsumen',
        'nik',
        'konsumen_name',
        'fk_me',
        'me_name',
        'fk_causer',
        'causer_name',
        'status',
        'type',
        'note',
        'description',
        'old_data',
        'new_data',
        'ip_address',
        'user_agent',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'action'     => LogKonsumenAction::class,
            'status'     => StatusKonsumen::class,
            'type'       => TypeTempKonsumen::class,
            'old_data'   => 'array',
            'new_data'   => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function konsumen(): BelongsTo
    {
        return $this->belongsTo(Konsumen::class, 'fk_konsumen');
    }

    public function tempKonsumen(): BelongsTo
    {
        return $this->belongsTo(TempKonsumen::class, 'fk_temp_konsumen');
    }

    public function me(): BelongsTo
    {
        return $this->belongsTo(User::class, 'fk_me');
    }

    public function causer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'fk_causer');
    }
}

