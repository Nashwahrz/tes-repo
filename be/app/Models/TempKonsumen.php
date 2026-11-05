<?php

namespace App\Models;

use App\Enums\JenisKelamin;
use App\Enums\StatusKonsumen;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\URL;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class TempKonsumen extends Model
{
    use LogsActivity;

    protected $table = 'temp.temp_konsumens';

    protected $fillable = [
        'id_me',
        'id_konsumen',
        'tipe',
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
        'status',
        'catatan',
        'data_sebelumnya',
        'diverifikasi_oleh',
        'diverifikasi_at',
    ];

    protected $appends = ['foto_ktp_url', 'catatan_penolakan'];

    protected function casts(): array
    {
        return [
            'tgl_lahir'       => 'date',
            'jenis_kelamin'   => JenisKelamin::class,
            'status'          => StatusKonsumen::class,
            'latitude'        => 'decimal:7',
            'longitude'       => 'decimal:7',
            'data_sebelumnya' => 'array',
            'diverifikasi_at' => 'datetime',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('temp konsumen')
            ->logOnly(['id_me', 'id_konsumen', 'tipe', 'nik', 'name', 'status', 'catatan', 'diverifikasi_oleh'])
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
                now()->addMinutes(10),
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
        return $this->belongsTo(User::class, 'id_me');
    }

    public function konsumen()
    {
        return $this->belongsTo(Konsumen::class, 'id_konsumen');
    }

    public function verifiedBy()
    {
        return $this->belongsTo(User::class, 'diverifikasi_oleh');
    }

    public function verifikator()
    {
        return $this->verifiedBy();
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
