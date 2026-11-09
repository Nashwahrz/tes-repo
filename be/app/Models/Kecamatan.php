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
            ->logOnly(['kecamatan_code', 'kecamatan_name', 'fk_kabupaten_kota', 'status'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    protected $fillable = [
        'kecamatan_code',
        'kecamatan_name',
        'fk_kabupaten_kota',
        'status'
    ];

    public function kabupatenKota()
    {
        return $this->belongsTo(KabupatenKota::class, 'fk_kabupaten_kota', 'kabupaten_kota_code');
    }
}
