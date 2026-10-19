<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PermissionRole extends Model
{
    protected $table = 'hak_akses.permission_roles';

     protected $fillable = [
        'id_role',
        'id_permission',
    ];

    public function role()
    {
        return $this->belongsTo(Role::class, 'id_role');
    }

    public function permission()
    {
        return $this->belongsTo(Permission::class, 'id_permission');
    }
}
