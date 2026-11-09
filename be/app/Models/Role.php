<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Role extends Model
{
    use LogsActivity;
    protected $table = 'hak_akses.roles';

    protected $fillable = [
        'role_name'
    ];
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('role')
            ->logOnly(['role_name'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    public function menus()
    {
        return $this->belongsToMany(Menu::class, 'hak_akses.menu_roles', 'fk_role', 'fk_menu')->withTimestamps();
    }

    public function roleMenus()
    {
        return $this->hasMany(MenuRole::class, 'fk_role');
    }

    public function permissions()
    {
        return $this->belongsToMany(Permission::class, 'hak_akses.permission_roles', 'fk_role', 'fk_permission')->withTimestamps();
    }

    public function permissionRoles()
    {
        return $this->hasMany(PermissionRole::class, 'fk_role');
    }
}

