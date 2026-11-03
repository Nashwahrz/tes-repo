<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Kelurahan extends Model
{
    use LogsActivity;
    protected $table = 'master.kelurahans';
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('kelurahan')
            ->logOnly(['kode', 'name', 'kode_kecamatan', 'status'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    protected $fillable = [
        'kode',
        'name',
        'kode_kecamatan',
        'status'
    ];

    public function kecamatan()
    {
        return $this->belongsTo(Kecamatan::class, 'kode_kecamatan', 'kode');
    }
}
