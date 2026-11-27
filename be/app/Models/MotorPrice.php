<?php

namespace App\Models;

use App\Enums\StatusMasterData;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MotorPrice extends Model
{
    protected $table = 'master.motor_prices';

    protected $fillable = [
        'item_code',
        'tahun_produksi',
        'harga_kosong',
        'bbn_tnkb_hitam',
        'bbn_tnkb_merah',
        'status',
    ];

    protected $appends = [
        'otr_hitam',
        'otr_merah',
    ];

    protected function casts(): array
    {
        return [
            'tahun_produksi' => 'integer',
            'harga_kosong'   => 'float',
            'bbn_tnkb_hitam' => 'float',
            'bbn_tnkb_merah' => 'float',
        ];
    }

    public function getStatusAttribute(mixed $value): string
    {
        return StatusMasterData::labelFromBoolean($value);
    }

    public function getOtrHitamAttribute(): float
    {
        return round((float) $this->harga_kosong + (float) $this->bbn_tnkb_hitam, 2);
    }

    public function getOtrMerahAttribute(): float
    {
        return round((float) $this->harga_kosong + (float) $this->bbn_tnkb_merah, 2);
    }

    public function motor(): BelongsTo
    {
        return $this->belongsTo(Motor::class, 'item_code', 'item_code');
    }

    public function units(): HasMany
    {
        return $this->hasMany(MotorUnit::class, 'item_code', 'item_code');
    }
}
