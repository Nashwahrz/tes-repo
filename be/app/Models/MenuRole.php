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
        'fk_role',
        'fk_menu',
    ];
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('menu roles')
            ->logOnly(['fk_role', 'fk_menu'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    public function role()
    {
        return $this->belongsTo(Role::class, 'fk_role');
    }

    public function menu()
    {
        return $this->belongsTo(Menu::class, 'fk_menu');
    }
}
