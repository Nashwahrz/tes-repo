<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Menu extends Model
{
    protected $table = 'hak_akses.menus';

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
        return $this->belongsToMany(Role::class, 'hak_akses.menu_roles', 'id_menu', 'id_role')->withTimestamps();
    }

    public function menuRoles()
    {
        return $this->hasMany(MenuRole::class, 'id_menu');
    }
}

