<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    protected $fillable = [
        'name'
    ];

    public function menus()
    {
        return $this->belongsToMany(Menu::class, 'role_menus', 'id_role', 'id_menu')->withTimestamps();
    }

    public function roleMenus()
    {
        return $this->hasMany(RoleMenu::class, 'id_role');
    }

    public function permissions()
    {
        return $this->belongsToMany(Permission::class, 'role_permissions', 'id_role', 'id_permission')->withTimestamps();
    }

    public function rolePermissions()
    {
        return $this->hasMany(RolePermission::class, 'id_role');
    }
}

