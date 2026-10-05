<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Menu extends Model
{
    protected $fillable = [
        'nama_menu',
        'url',
        'urutan',
        'status',
    ];

    protected $casts = [
        'status' => 'boolean',
        'urutan' => 'integer',
    ];

    public function roles()
    {
        return $this->belongsToMany(Role::class, 'role_menus', 'id_role', 'id_menu')->withTimestamps();
    }

    public function roleMenus()
    {
        return $this->hasMany(RoleMenu::class, 'id_menu');
    }
}

