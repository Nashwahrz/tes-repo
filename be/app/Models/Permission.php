<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Permission extends Model
{
    protected $table = 'hak_akses.permissions';

    protected $fillable = [
        'nama_permission',
    ];

    public function roles()
    {
        return $this->belongsToMany(Role::class, 'hak_akses.permission_roles', 'id_permission', 'id_role')->withTimestamps();
    }

    public function permissionRoles()
    {
        return $this->hasMany(PermissionRole::class, 'id_permission');
    }
}
