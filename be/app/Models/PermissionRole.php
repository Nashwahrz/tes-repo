<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class PermissionRole extends Model
{
    // use LogsActivity;
    protected $table = 'hak_akses.permission_roles';

     protected $fillable = [
        'fk_role',
        'fk_permission',
    ];
    // public function getActivitylogOptions(): LogOptions
    // {
    //     return LogOptions::defaults()
    //         ->useLogName('permission roles')
    //         ->logOnly(['fk_role', 'fk_permission'])
    //         ->logOnlyDirty()
    //         ->dontSubmitEmptyLogs();
    // }

    public function role()
    {
        return $this->belongsTo(Role::class, 'fk_role');
    }

    public function permission()
    {
        return $this->belongsTo(Permission::class, 'fk_permission');
    }
}
