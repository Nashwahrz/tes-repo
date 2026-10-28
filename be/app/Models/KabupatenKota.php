<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KabupatenKota extends Model
{
    protected $table = 'master.kabupaten_kotas';

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
