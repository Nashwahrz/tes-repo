<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TempMotor extends Model
{
    protected $table = 'temp.temp_motors';

    protected $fillable = [
        'master_unit_id',
        'dikunci_oleh',
        'dikunci_sampai',
        'catatan',
    ];

    protected function casts(): array
    {
        return [
            'dikunci_sampai' => 'datetime',
        ];
    }

    public function masterUnit(): BelongsTo
    {
        return $this->belongsTo(MotorUnit::class, 'master_unit_id');
    }

    public function dikunciOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dikunci_oleh');
    }
}
