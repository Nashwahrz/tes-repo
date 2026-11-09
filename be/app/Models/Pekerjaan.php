<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Pekerjaan extends Model
{
    use LogsActivity;
    protected $table = 'master.pekerjaans';
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('pekerjaan')
            ->logOnly(['pekerjaan_code', 'pekerjaan_name', 'status'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
    protected $fillable = [
        'pekerjaan_code',
        'pekerjaan_name',
        'status'
    ];
}
