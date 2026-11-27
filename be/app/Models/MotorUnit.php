<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class MotorUnit extends Model
{
    public const STATUS_AVAILABLE  = 'AVAILABLE';
    public const STATUS_RESERVED   = 'RESERVED';
    public const STATUS_SOLD       = 'SOLD';
    public const STATUS_IN_TRANSIT = 'IN_TRANSIT';
    public const STATUS_DAMAGED    = 'DAMAGED';

    protected $table = 'master.master_units';

    // Disimpan sebagai catatan untuk modul Penjualan nanti:
    // protected $appends = [
    //     'detected_tahun_produksi',
    //     'recommended_motor_price_id',
    // ];

    protected $fillable = [
        'motor_stock_id',
        'dealer_id',
        'item_code',
        'nomor_rangka',
        'nomor_mesin',
        'status',
        'tanggal_terjual',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_terjual' => 'datetime',
        ];
    }

    public function stock(): BelongsTo
    {
        return $this->belongsTo(MotorStock::class, 'motor_stock_id');
    }

    public function dealer(): BelongsTo
    {
        return $this->belongsTo(Dealer::class, 'dealer_id');
    }

    public function motor(): BelongsTo
    {
        return $this->belongsTo(Motor::class, 'item_code', 'item_code');
    }

    public function motorPrices(): HasMany
    {
        return $this->hasMany(MotorPrice::class, 'item_code', 'item_code')
            ->orderByDesc('tahun_produksi');
    }

    public function tempMotor(): HasOne
    {
        return $this->hasOne(TempMotor::class, 'master_unit_id');
    }

    public function movements(): HasMany
    {
        return $this->hasMany(MotorUnitMovement::class, 'motor_unit_id');
    }

    /*
    // Catatan untuk pencocokan otomatis tahun produksi saat masuk modul Penjualan:
    public function getDetectedTahunProduksiAttribute(): ?int
    {
        $vin = strtoupper(trim((string) $this->nomor_rangka));
        if (strlen($vin) !== 17) {
            return null;
        }

        $map = [
            'L' => 2020,
            'M' => 2021,
            'N' => 2022,
            'P' => 2023,
            'R' => 2024,
            'S' => 2025,
            'T' => 2026,
            'V' => 2027,
            'W' => 2028,
            'X' => 2029,
            'Y' => 2030,
        ];

        return $map[$vin[9]] ?? null;
    }

    public function getRecommendedMotorPriceIdAttribute(): ?int
    {
        if (! $this->relationLoaded('motorPrices')) {
            return null;
        }

        $prices = $this->motorPrices;
        if ($prices->isEmpty()) {
            return null;
        }

        $detectedYear = $this->detected_tahun_produksi;
        if ($detectedYear !== null) {
            $matched = $prices->firstWhere('tahun_produksi', $detectedYear);
            if ($matched) {
                return $matched->id;
            }
        }

        return $prices->first()?->id;
    }
    */
}
