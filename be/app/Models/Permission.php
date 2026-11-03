<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Permission extends Model
{
    use LogsActivity;
    protected $table = 'hak_akses.permissions';

    protected $fillable = [
        'nama_permission',
    ];
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('permission')
            ->logOnly(['nama_permission'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    public function roles()
    {
        return $this->belongsToMany(Role::class, 'hak_akses.permission_roles', 'id_permission', 'id_role')->withTimestamps();
    }

    public function permissionRoles()
    {
        return $this->hasMany(PermissionRole::class, 'id_permission');
    }
}
