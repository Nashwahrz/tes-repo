<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MotorUnitMovement extends Model
{
    public const TYPE_STOCK_IN      = 'UNIT_MASUK';
    public const TYPE_RESERVE       = 'DIKUNCI';
    public const TYPE_RELEASE       = 'LEPAS_KUNCI';
    public const TYPE_SELL          = 'TERJUAL';
    public const TYPE_STATUS_CHANGE = 'UBAH_STATUS';
    public const TYPE_DELETE        = 'DIHAPUS';

    public const UPDATED_AT = null;

    protected $table = 'log.log_motor_unit_movements';

    protected $fillable = [
        'motor_unit_id',
        'motor_stock_id',
        'dealer_id',
        'item_code',
        'jenis_pergerakan',
        'status_awal',
        'status_akhir',
        'user_id',
        'catatan',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(MotorUnit::class, 'motor_unit_id');
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

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
