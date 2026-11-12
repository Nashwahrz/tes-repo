<?php

namespace App\Models;

use App\Enums\JenisKelamin;
use App\Enums\SignedUrlLifetime;
use App\Enums\StatusKonsumen;
use App\Enums\TypeTempKonsumen;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\URL;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class TempKonsumen extends Model
{
    // use LogsActivity;

    protected $table = 'temp.temp_konsumens';

    // protected $fillable = [
    //     'fk_me',
    //     'fk_konsumen',
    //     'type',
    //     'nik',
    //     'konsumen_name',
    //     'fk_temp_lahir',
    //     'birth_date',
    //     'gender',
    //     'ktp_address',
    //     'domicile_address',
    //     'latitude',
    //     'longitude',
    //     'rt',
    //     'rw',
    //     'fk_kelurahan',
    //     'fk_kecamatan',
    //     'fk_kabupaten_kota',
    //     'fk_provinsi',
    //     'fk_agama',
    //     'marital_status',
    //     'fk_pekerjaan',
    //     'nationality',
    //     'phone',
    //     'email',
    //     'foto_ktp',
    //     'status',
    //     'note',
    //     'old_data',
    //     'verified_by',
    //     'verified_at',
    // ];

    protected $appends = ['foto_ktp_url'];

    protected function casts(): array
    {
        return [
            'type'            => TypeTempKonsumen::class,
            'birth_date'       => 'date',
            'gender'   => JenisKelamin::class,
            'status'          => StatusKonsumen::class,
            'latitude'        => 'decimal:7',
            'longitude'       => 'decimal:7',
            'old_data' => 'array',
            'verified_at' => 'datetime',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('temp konsumen')
            ->logOnly(['fk_me', 'fk_konsumen', 'type', 'nik', 'konsumen_name', 'status', 'note', 'verified_by'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
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
                ['id' => $this->getKey(), 'type' => 'temp'],
                false
            );
        });
    }

    protected function catatanPenolakan(): Attribute
    {
        return Attribute::get(fn () => $this->catatan);
    }

    public function me()
    {
        return $this->belongsTo(User::class, 'fk_me');
    }

    public function konsumen()
    {
        return $this->belongsTo(Konsumen::class, 'fk_konsumen');
    }

    public function verifiedBy()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function verifikator()
    {
        return $this->verifiedBy();
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
