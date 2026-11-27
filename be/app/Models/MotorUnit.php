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

    protected $fillable = [
        'motor_stock_id',
        'dealer_id',
        'item_code',
        'motor_price_id',
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

    public function motorPrice(): BelongsTo
    {
        return $this->belongsTo(MotorPrice::class, 'motor_price_id');
    }

    public function tempMotor(): HasOne
    {
        return $this->hasOne(TempMotor::class, 'master_unit_id');
    }

    public function movements(): HasMany
    {
        return $this->hasMany(MotorUnitMovement::class, 'motor_unit_id');
    }
}
