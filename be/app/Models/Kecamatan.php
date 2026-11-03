<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Kecamatan extends Model
{
    use LogsActivity;
    protected $table = 'master.kecamatans';
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('kecamatan')
            ->logOnly(['kode', 'name', 'kode_kabupaten_kota', 'status'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    protected $fillable = [
        'kode',
        'name',
        'kode_kabupaten_kota',
        'status'
    ];

    public function kabupatenKota()
    {
        return $this->belongsTo(KabupatenKota::class, 'kode_kabupaten_kota', 'kode');
    }
}
