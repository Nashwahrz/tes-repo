<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RoleMenu extends Model
{
    protected $fillable = [
        'id_role',
        'id_menu',
    ];

    public function role()
    {
        return $this->belongsTo(Role::class, 'id_role');
    }

    public function menu()
    {
        return $this->belongsTo(Menu::class, 'id_menu');
    }
}

