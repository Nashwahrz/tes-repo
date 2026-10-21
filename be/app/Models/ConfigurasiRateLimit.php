<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ConfigurasiRateLimit extends Model
{
    protected $table = 'setting.configurasi_rate_limits';
    protected $fillable = [
        'name',
        'request_per_minutes',
        'minutes',
        'is_active',
    ];
}
