<?php

namespace App\Models;

use App\Enums\OtpPurpose;
use Illuminate\Database\Eloquent\Model;

class Otp extends Model
{
    protected $fillable = [
        'fk_user',
        'purpose',
        'otp',
        'otp_expires_at',
    ];

    protected function casts(): array
    {
        return [
            'purpose'    => OtpPurpose::class,
            'otp_expires_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'fk_user');
    }

    public function isExpired(): bool
    {
        return $this->otp_expires_at ? $this->expires_at->isPast() : true;
    }
}

