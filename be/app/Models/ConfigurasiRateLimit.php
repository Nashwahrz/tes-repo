<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class ConfigurasiRateLimit extends Model
{
    use LogsActivity;
    protected $table = 'setting.configurasi_rate_limits';
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('configurasi rate limit')
            ->logOnly(['name', 'request_per_minutes', 'minutes', 'status'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
    protected $fillable = [
        'name',
        'request_per_minutes',
        'minutes',
        'status',
    ];
}
