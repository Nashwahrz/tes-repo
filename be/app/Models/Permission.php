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
        'permission_name',
    ];
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('permission')
            ->logOnly(['permission_name'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    public function roles()
    {
        return $this->belongsToMany(Role::class, (new PermissionRole())->getTable(), 'fk_permission', 'fk_role')->withTimestamps();
    }

    public function permissionRoles()
    {
        return $this->hasMany(PermissionRole::class, 'fk_permission');
    }
}
