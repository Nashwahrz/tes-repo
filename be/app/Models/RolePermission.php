<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RolePermission extends Model
{
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
