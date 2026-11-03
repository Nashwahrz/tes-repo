<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Agama extends Model
{
    use LogsActivity;
    protected $table = 'master.agamas';
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('agama')
            ->logOnly(['kode', 'name', 'status'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
    protected $fillable = [
        'kode',
        'name',
        'status',
    ];

}
