<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Penjualan extends Model
{
    public const STATUS_MENUNGGU = 'MENUNGGU_PEMBAYARAN';
    public const STATUS_LUNAS    = 'LUNAS';
    public const STATUS_BATAL    = 'BATAL';

    public const METODE_CASH   = 'CASH';
    public const METODE_KREDIT = 'KREDIT';

    protected $table = 'penjualans';

    protected $fillable = [
        'no_transaksi',
        'tanggal_transaksi',
        'dealer_id',
        'konsumen_id',
        'motor_unit_id',
        'item_code',
        'sales_id',
        'kasir_id',
        'metode_pembayaran',
        'harga_otr',
        'diskon',
        'uang_muka',
        'total_harga',
        'nama_leasing',
        'tenor_bulan',
        'angsuran_per_bulan',
        'status',
        'tanggal_lunas',
        'alasan_batal',
        'catatan',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_transaksi'  => 'date:Y-m-d',
            'harga_otr'          => 'float',
            'diskon'             => 'float',
            'uang_muka'          => 'float',
            'total_harga'        => 'float',
            'tenor_bulan'        => 'integer',
            'angsuran_per_bulan' => 'float',
            'tanggal_lunas'      => 'datetime',
        ];
    }

    public function dealer(): BelongsTo
    {
        return $this->belongsTo(Dealer::class, 'dealer_id');
    }

    public function konsumen(): BelongsTo
    {
        return $this->belongsTo(Konsumen::class, 'konsumen_id');
    }

    public function motorUnit(): BelongsTo
    {
        return $this->belongsTo(MotorUnit::class, 'motor_unit_id');
    }

    public function motor(): BelongsTo
    {
        return $this->belongsTo(Motor::class, 'item_code', 'item_code');
    }

    public function sales(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sales_id');
    }

    public function kasir(): BelongsTo
    {
        return $this->belongsTo(User::class, 'kasir_id');
    }
}
