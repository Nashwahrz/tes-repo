<?php

namespace App\Models;

use App\Enums\LogAction;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LogActivityPermission extends Model
{
    public const UPDATED_AT = null;

    protected $table = 'log.log_activity_permissions';

    protected $fillable = [
        'action',
        'fk_role',
        'role_name',
        'fk_permission',
        'permission_name',
        'fk_causer',
        'causer_name',
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
            'old_data'   => 'array',
            'new_data'   => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'fk_role');
    }

    public function permission(): BelongsTo
    {
        return $this->belongsTo(Permission::class, 'fk_permission');
    }

    public function causer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'fk_causer');
    }
}
