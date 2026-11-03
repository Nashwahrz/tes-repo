<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class MenuRole extends Model
{
    use LogsActivity;
    protected $table = 'hak_akses.menu_roles';
    protected $fillable = [
        'id_role',
        'id_menu',
    ];
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('menu roles')
            ->logOnly(['id_role', 'id_menu'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    public function role()
    {
        return $this->belongsTo(Role::class, 'id_role');
    }

    public function menu()
    {
        return $this->belongsTo(Menu::class, 'id_menu');
    }
}
