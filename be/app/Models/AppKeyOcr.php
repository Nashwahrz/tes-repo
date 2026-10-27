<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class AppKeyOcr extends Model
{
    protected $table = 'setting.app_key_ocrs';
    protected $fillable = [
        'url',
        'api_key',
        'keterangan',
        'is_active',
    ];
    protected $casts = [
        'is_active' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::saved(function () {
            Cache::forget('active_app_key_ocr');
        });

        static::deleted(function () {
            Cache::forget('active_app_key_ocr');
        });
    }
}
