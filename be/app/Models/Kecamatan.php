<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Kecamatan extends Model
{
    protected $table = 'master.kecamatans';

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
