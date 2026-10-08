<?php

namespace App\Models;

use App\Enums\JenisKelamin;
use App\Enums\StatusKonsumen;
use Illuminate\Database\Eloquent\Model;

class Konsumen extends Model
{
    protected $fillable = [
        'id_me',
        'nik',
        'name',
        'tmp_lahir',
        'tgl_lahir',
        'jenis_kelamin',
        'alamat',
        'latitude',
        'longitude',
        'rt',
        'rw',
        'desa_kelurahan',
        'kecamatan',
        'kabupaten_kota',
        'provinsi',
        'agama',
        'status_perkawinan',
        'pekerjaan',
        'kewarganegaraan',
        'no_telp',
        'email',
        'foto_ktp',
        'status',
        'catatan_penolakan',
        'diverifikasi_oleh',
    ];
    protected function casts(): array
    {
        return [
            'tgl_lahir'     => 'date',
            'jenis_kelamin' => JenisKelamin::class,
            'status'        => StatusKonsumen::class,
            'latitude'      => 'decimal:7',
            'longitude'     => 'decimal:7',
        ];
    }
    public function me()
    {
        return $this->belongsTo(User::class, 'id_me');
    }
    public function verifiedBy()
    {
        return $this->belongsTo(User::class, 'diverifikasi_oleh');
    }
}
