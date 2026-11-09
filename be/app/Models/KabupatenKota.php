<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class KabupatenKota extends Model
{
    use LogsActivity;
    protected $table = 'master.kabupaten_kotas';
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('kabupaten kota')
            ->logOnly(['kabupaten_kota_code', 'kabupaten_kota_name', 'fk_provinsi', 'status'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    protected $fillable = [
        'kabupaten_kota_code',
        'kabupaten_kota_name',
        'fk_provinsi',
        'status'
    ];
    

    public function provinsi()
    {
        return $this->belongsTo(Provinsi::class, 'fk_provinsi', 'provinsi_code');
    }
}
