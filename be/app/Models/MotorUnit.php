<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MotorUnit extends Model
{
    public const STATUS_AVAILABLE  = 'AVAILABLE';
    public const STATUS_RESERVED   = 'RESERVED';
    public const STATUS_SOLD       = 'SOLD';
    public const STATUS_IN_TRANSIT = 'IN_TRANSIT';
    public const STATUS_DAMAGED    = 'DAMAGED';

    protected $table = 'motor_units';

    protected $fillable = [
        'motor_stock_id',
        'dealer_id',
        'item_code',
        'nomor_rangka',
        'nomor_mesin',
        'status',
        'dikunci_oleh',
        'dikunci_sampai',
        'tanggal_terjual',
    ];

    protected function casts(): array
    {
        return [
            'dikunci_sampai'  => 'datetime',
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

    public function dikunciOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dikunci_oleh');
    }

    public function movements(): HasMany
    {
        return $this->hasMany(MotorUnitMovement::class, 'motor_unit_id');
    }
}
