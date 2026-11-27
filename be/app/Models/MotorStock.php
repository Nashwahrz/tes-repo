<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MotorStock extends Model
{
    protected $table = 'motor_stocks';

    protected $fillable = [
        'dealer_id',
        'item_code',
        'stok_tersedia',
        'stok_dalam_proses',
        'stok_gudang',
        'stok_terjual',
    ];

    protected function casts(): array
    {
        return [
            'stok_tersedia'     => 'integer',
            'stok_dalam_proses' => 'integer',
            'stok_gudang'       => 'integer',
            'stok_terjual'      => 'integer',
        ];
    }

    public function dealer(): BelongsTo
    {
        return $this->belongsTo(Dealer::class, 'dealer_id');
    }

    public function motor(): BelongsTo
    {
        return $this->belongsTo(Motor::class, 'item_code', 'item_code');
    }

    public function units(): HasMany
    {
        return $this->hasMany(MotorUnit::class, 'motor_stock_id');
    }

    /**
     * Hitung ulang (SUM) kuantitas di tabel motor_stocks dari status unit fisik di master.master_units.
     */
    public function syncFromUnits(): self
    {
        $tersedia    = $this->units()->where('status', MotorUnit::STATUS_AVAILABLE)->count();
        $dalamProses = $this->units()->where('status', MotorUnit::STATUS_RESERVED)->count();
        $terjual     = $this->units()->where('status', MotorUnit::STATUS_SOLD)->count();
        $gudang      = $tersedia + $dalamProses;

        $this->update([
            'stok_tersedia'     => $tersedia,
            'stok_dalam_proses' => $dalamProses,
            'stok_gudang'       => $gudang,
            'stok_terjual'      => $terjual,
        ]);

        return $this->fresh(['dealer', 'motor']);
    }
}
