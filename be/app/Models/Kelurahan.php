<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Kelurahan extends Model
{
    // use LogsActivity;
    protected $table = 'master.kelurahans';
    // public function getActivitylogOptions(): LogOptions
    // {
    //     return LogOptions::defaults()
    //         ->useLogName('kelurahan')
    //         ->logOnly(['kelurahan_code', 'kelurahan_name', 'fk_kecamatan', 'status'])
    //         ->logOnlyDirty()
    //         ->dontSubmitEmptyLogs();
    // }

    protected $fillable = [
        'kelurahan_code',
        'kelurahan_name',
        'fk_kecamatan',
        'status'
    ];

    public function kecamatan()
    {
        return $this->belongsTo(Kecamatan::class, 'fk_kecamatan', 'kecamatan_code');
    }
}
