<?php

namespace App\Models;

use App\Enums\JenisKelamin;
use App\Enums\StatusKonsumen;
use App\Models\Scopes\KonsumenDealerScope;
use Illuminate\Database\Eloquent\Attributes\ScopedBy;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\URL;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

// #[ScopedBy([KonsumenDealerScope::class])]
class Konsumen extends Model
{
    use LogsActivity;
     public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('konsumen')
            ->logOnly([
                //  'id_me',
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
                //  'status',
                //  'catatan_penolakan',
                //  'diverifikasi_oleh'
                ])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
    protected $fillable = [
        // 'id_me',
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
        // 'status',
        // 'catatan_penolakan',
        // 'diverifikasi_oleh',
    ];
    protected $appends = ['foto_ktp_url'];
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

    public function tempatLahir()
    {
        return $this->belongsTo(KabupatenKota::class, 'id_tmp_lahir');
    }
    public function kelurahan()
    {
        return $this->belongsTo(Kelurahan::class, 'id_kelurahan');
    }
    public function kecamatan()
    {
        return $this->belongsTo(Kecamatan::class, 'id_kecamatan');
    }
    public function kabupatenKota()
    {
        return $this->belongsTo(KabupatenKota::class, 'id_kabupaten_kota');
    }
    public function provinsi()
    {
        return $this->belongsTo(Provinsi::class, 'id_provinsi');
    }
    public function agama()
    {
        return $this->belongsTo(Agama::class, 'id_agama');
    }
    public function pekerjaan()
    {
        return $this->belongsTo(Pekerjaan::class, 'id_pekerjaan');
    }
    // public function verifiedBy()
    // {
    //     return $this->belongsTo(User::class, 'diverifikasi_oleh');
    // }
}
