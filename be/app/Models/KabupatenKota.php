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
            ->logOnly(['kode', 'name', 'kode_provinsi', 'status'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    protected $fillable = [
        'kode',
        'name',
        'kode_provinsi',
        'status'
    ];
    

    public function provinsi()
    {
        return $this->belongsTo(Provinsi::class, 'kode_provinsi', 'kode');
    }
}
