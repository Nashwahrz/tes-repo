<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Permission extends Model
{
    protected $fillable = [
        'nama_permission',
    ];

    public function roles()
    {
        return $this->belongsToMany(Role::class, 'role_permissions', 'id_permission', 'id_role')->withTimestamps();
    }

    public function rolePermissions()
    {
        return $this->hasMany(RolePermission::class, 'id_permission');
    }
}
