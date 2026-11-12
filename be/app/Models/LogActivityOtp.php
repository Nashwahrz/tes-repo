<?php

namespace App\Models;

use App\Enums\LogOtpAction;
use App\Enums\OtpPurpose;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LogActivityOtp extends Model
{
    protected $table = 'log.log_activity_otps';

    public $timestamps = false;

    protected $fillable = [
        'fk_user',
        'email',
        'purpose',
        'action',
        'description',
        'ip_address',
        'user_agent',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'purpose'    => OtpPurpose::class,
            'action'     => LogOtpAction::class,
            'created_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'fk_user');
    }
}

