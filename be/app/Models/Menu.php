<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Menu extends Model
{
    use LogsActivity;
    
    protected $table = 'hak_akses.menus';
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('menu')
            ->logOnly(['nama_menu', 'url', 'urutan', 'status'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
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

