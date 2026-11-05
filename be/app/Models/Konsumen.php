<?php

namespace App\Models;

use App\Enums\JenisKelamin;
use App\Enums\StatusKonsumen;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\URL;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Konsumen extends Model
{
    use LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('konsumen')
            ->logOnly([
                'nik',
                'name',
                'kode_tmp_lahir',
                'tgl_lahir',
                'jenis_kelamin',
                'alamat_ktp',
                'alamat_domisili',
                'latitude',
                'longitude',
                'rt',
                'rw',
                'kode_kelurahan',
                'kode_kecamatan',
                'kode_kabupaten_kota',
                'kode_provinsi',
                'kode_agama',
                'status_perkawinan',
                'kode_pekerjaan',
                'kewarganegaraan',
                'no_telp',
                'email',
                'foto_ktp',
            ])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    protected $fillable = [
        'nik',
        'name',
        'kode_tmp_lahir',
        'tgl_lahir',
        'jenis_kelamin',
        'alamat_ktp',
        'alamat_domisili',
        'latitude',
        'longitude',
        'rt',
        'rw',
        'kode_kelurahan',
        'kode_kecamatan',
        'kode_kabupaten_kota',
        'kode_provinsi',
        'kode_agama',
        'status_perkawinan',
        'kode_pekerjaan',
        'kewarganegaraan',
        'no_telp',
        'email',
        'foto_ktp',
    ];

    protected $appends = ['foto_ktp_url', 'status'];

    protected function casts(): array
    {
        return [
            'tgl_lahir'     => 'date',
            'jenis_kelamin' => JenisKelamin::class,
            'latitude'      => 'decimal:7',
            'longitude'     => 'decimal:7',
        ];
    }

    protected function status(): Attribute
    {
        return Attribute::get(fn () => StatusKonsumen::Diterima);
    }

    protected function fotoKtpUrl(): Attribute
    {
        return Attribute::get(function () {
            if (!$this->foto_ktp || !$this->exists) {
                return null;
            }

            return URL::temporarySignedRoute(
                'konsumens.foto-ktp',
                now()->addMinutes(10),
                ['id' => $this->getKey()],
                false
            );
        });
    }

    public function konsumenMes()
    {
        return $this->hasMany(KonsumenMe::class, 'id_konsumen');
    }

    public function mes()
    {
        return $this->belongsToMany(User::class, 'konsumen_mes', 'id_konsumen', 'id_me');
    }

    public function tempKonsumens()
    {
        return $this->hasMany(TempKonsumen::class, 'id_konsumen');
    }

    public function tempatLahir()
    {
        return $this->belongsTo(KabupatenKota::class, 'kode_tmp_lahir', 'kode');
    }

    public function kelurahan()
    {
        return $this->belongsTo(Kelurahan::class, 'kode_kelurahan', 'kode');
    }

    public function kecamatan()
    {
        return $this->belongsTo(Kecamatan::class, 'kode_kecamatan', 'kode');
    }

    public function kabupatenKota()
    {
        return $this->belongsTo(KabupatenKota::class, 'kode_kabupaten_kota', 'kode');
    }

    public function provinsi()
    {
        return $this->belongsTo(Provinsi::class, 'kode_provinsi', 'kode');
    }

    public function agama()
    {
        return $this->belongsTo(Agama::class, 'kode_agama', 'kode');
    }

    public function pekerjaan()
    {
        return $this->belongsTo(Pekerjaan::class, 'kode_pekerjaan', 'kode');
    }
}
