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
            ->logOnly([
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
                 'diverifikasi_oleh'
                ])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
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
    public function me()
    {
        return $this->belongsTo(User::class, 'id_me');
    }
    public function verifiedBy()
    {
        return $this->belongsTo(User::class, 'diverifikasi_oleh');
    }
}
