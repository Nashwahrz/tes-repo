<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class UrlIpLogin extends Model
{
    protected $table = 'setting.url_ip_logins';

    protected $fillable = [
        'url',
        'is_active',
    ];

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
