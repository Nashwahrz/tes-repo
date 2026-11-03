<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class UrlIpLogin extends Model
{
    use LogsActivity;
    protected $table = 'setting.url_ip_logins';

    protected $fillable = [
        'url',
        'is_active',
    ];
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('email whitelist')
            ->logOnly(['domain', 'is_active', 'created_by'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    protected $casts = [
        'is_active' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::saved(function () {
            Cache::forget('active_url_ip_login');
        });

        static::deleted(function () {
            Cache::forget('active_url_ip_login');
        });
    }
}
