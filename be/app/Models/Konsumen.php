<?php

namespace App\Models;

use App\Enums\JenisKelamin;
use App\Enums\SignedUrlLifetime;
use App\Enums\StatusKonsumen;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\URL;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Konsumen extends Model
{
    // use LogsActivity;

    // public function getActivitylogOptions(): LogOptions
    // {
    //     return LogOptions::defaults()
    //         ->useLogName('konsumen')
    //         ->logOnly([
    //             'nik',
    //             'konsumen_name',
    //             'fk_temp_lahir',
    //             'birth_date',
    //             'gender',
    //             'ktp_address',
    //             'domicile_address',
    //             'latitude',
    //             'longitude',
    //             'rt',
    //             'rw',
    //             'fk_kelurahan',
    //             'fk_kecamatan',
    //             'fk_kabupaten_kota',
    //             'fk_provinsi',
    //             'fk_agama',
    //             'marital_status',
    //             'fk_pekerjaan',
    //             'nationality',
    //             'phone',
    //             'email',
    //             'foto_ktp',
    //         ])
    //         ->logOnlyDirty()
    //         ->dontSubmitEmptyLogs();
    // }

    protected $fillable = [
        'nik',
        'konsumen_name',
        'fk_temp_lahir',
        'birth_date',
        'gender',
        'ktp_address',
        'domicile_address',
        'latitude',
        'longitude',
        'rt',
        'rw',
        'fk_kelurahan',
        'fk_kecamatan',
        'fk_kabupaten_kota',
        'fk_provinsi',
        'fk_agama',
        'marital_status',
        'fk_pekerjaan',
        'nationality',
        'phone',
        'email',
        'foto_ktp',
    ];

    protected $appends = ['foto_ktp_url', 'status'];

    protected function casts(): array
    {
        return [
            'birth_date'     => 'date',
            'gender' => JenisKelamin::class,
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
                now()->addMinutes(SignedUrlLifetime::FotoKtp->value),
                ['id' => $this->getKey()],
                false
            );
        });
    }

    public function konsumenMes()
    {
        return $this->hasMany(KonsumenMe::class, 'fk_konsumen');
    }

    public function scopeEmpty($query)
    {
        return $query->whereNull('id');
    }

    public function mes()
    {
        return $this->belongsToMany(User::class, (new KonsumenMe())->getTable(), 'fk_konsumen', 'fk_me');
    }

    public function tempKonsumens()
    {
        return $this->hasMany(TempKonsumen::class, 'fk_konsumen');
    }

    public function tempatLahir()
    {
        return $this->belongsTo(KabupatenKota::class, 'fk_temp_lahir', 'kabupaten_kota_code');
    }

    public function kelurahan()
    {
        return $this->belongsTo(Kelurahan::class, 'fk_kelurahan', 'kelurahan_code');
    }

    public function kecamatan()
    {
        return $this->belongsTo(Kecamatan::class, 'fk_kecamatan', 'kecamatan_code');
    }

    public function kabupatenKota()
    {
        return $this->belongsTo(KabupatenKota::class, 'fk_kabupaten_kota', 'kabupaten_kota_code');
    }

    public function provinsi()
    {
        return $this->belongsTo(Provinsi::class, 'fk_provinsi', 'provinsi_code');
    }

    public function agama()
    {
        return $this->belongsTo(Agama::class, 'fk_agama', 'agama_code');
    }

    public function pekerjaan()
    {
        return $this->belongsTo(Pekerjaan::class, 'fk_pekerjaan', 'pekerjaan_code');
    }
}
