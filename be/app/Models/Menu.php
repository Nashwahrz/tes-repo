<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Menu extends Model
{
    // use LogsActivity;
    
    protected $table = 'hak_akses.menus';
    // public function getActivitylogOptions(): LogOptions
    // {
    //     return LogOptions::defaults()
    //         ->useLogName('menu')
    //         ->logOnly(['menu_name', 'url', 'sequence', 'status'])
    //         ->logOnlyDirty()
    //         ->dontSubmitEmptyLogs();
    // }
    protected $fillable = [
        'menu_name',
        'url',
        'sequence',
        'status',
    ];

    protected $casts = [
        'status' => 'boolean',
        'sequence' => 'integer',
    ];

    public function roles()
    {
        return $this->belongsToMany(Role::class, (new MenuRole())->getTable(), 'fk_menu', 'fk_role')->withTimestamps();
    }

    public function menuRoles()
    {
        return $this->hasMany(MenuRole::class, 'fk_menu');
    }
}

