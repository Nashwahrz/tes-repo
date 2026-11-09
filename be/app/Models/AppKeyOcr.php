<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class AppKeyOcr extends Model
{
    use LogsActivity;
    protected $table = 'setting.app_key_ocrs';
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('app key ocr')
            ->logOnly(['url','api_key','description', 'status'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
    protected $fillable = [
        'url',
        'api_key',
        'description',
        'status',
    ];
    protected $casts = [
        'status' => 'boolean',
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
