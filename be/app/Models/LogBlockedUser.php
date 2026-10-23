<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LogBlockedUser extends Model
{
    protected $table = 'log.log_blocked_users';

    protected $fillable = [
        'email',
        'ip_address',
        'type',
        'reason',
        'attempts',
        'blocked_at',
        'blocked_until',
        'is_unblocked',
        'unblocked_at',
        'unblocked_by',
    ];

    protected $casts = [
        'blocked_at'    => 'datetime',
        'blocked_until' => 'datetime',
        'unblocked_at'  => 'datetime',
        'is_unblocked'  => 'boolean',
        'attempts'      => 'integer',
    ];

    protected $appends = [
        'is_active_blocked',
        'remaining_seconds',
        'status',
    ];

    public function unblocker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'unblocked_by')->select(['id', 'name', 'email']);
    }

    public function getIsActiveBlockedAttribute(): bool
    {
        return ! $this->is_unblocked && $this->blocked_until !== null && $this->blocked_until->isFuture();
    }

    public function getRemainingSecondsAttribute(): int
    {
        if (! $this->is_active_blocked || ! $this->blocked_until) {
            return 0;
        }

        return max(0, (int) now()->diffInSeconds($this->blocked_until, false));
    }

    public function getStatusAttribute(): string
    {
        if ($this->is_unblocked) {
            return 'dibuka';
        }

        if ($this->is_active_blocked) {
            return 'aktif';
        }

        return 'kedaluwarsa';
    }
}
