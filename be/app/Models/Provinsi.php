<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Provinsi extends Model
{
    use LogsActivity;
    protected $table = 'master.provinsis';
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('provinsi')
            ->logOnly(['provinsi_code', 'provinsi_name', 'status'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
    protected $fillable = [
        'provinsi_code',
        'name',
        'status'
    ];
}
