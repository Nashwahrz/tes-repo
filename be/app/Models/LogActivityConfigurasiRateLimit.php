<?php

namespace App\Models;

use App\Enums\LogAction;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LogActivityConfigurasiRateLimit extends Model
{
    public const UPDATED_AT = null;
    protected $table = 'log.log_activity_configurasi_rate_limits';
    protected $fillable = [
        'fk_rate_limit',
        'rate_limit_name',
        'fk_causer',
        'causer_name',
        'action',
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
            'action'     => LogAction::class,
            'old_data'  => 'array',
            'new_data'  => 'array',
            'created_at' => 'datetime',
        ];
    }
    public function rateLimit(): BelongsTo
    {
        return $this->belongsTo(ConfigurasiRateLimit::class, 'fk_rate_limit');
    }

    public function causer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'fk_causer');
    }
}
