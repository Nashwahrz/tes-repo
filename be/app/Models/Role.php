<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    protected $table = 'hak_akses.roles';

    protected $fillable = [
        'name'
    ];

    public function menus()
    {
        return $this->belongsToMany(Menu::class, 'hak_akses.menu_roles', 'id_role', 'id_menu')->withTimestamps();
    }

    public function roleMenus()
    {
        return $this->hasMany(MenuRole::class, 'id_role');
    }

    public function permissions()
    {
        return $this->belongsToMany(Permission::class, 'hak_akses.permission_roles', 'id_role', 'id_permission')->withTimestamps();
    }

    public function permissionRoles()
    {
        return $this->hasMany(PermissionRole::class, 'id_role');
    }
}

