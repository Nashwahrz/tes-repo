<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Motor extends Model
{
    protected $table = 'master.motors';

    protected $fillable = [
        'item_code',
        'type_code',
        'type_description',
        'color_code',
        'color_description',
        'market_name',
        'class',
        'start_date',
        'end_date',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date:Y-m-d',
            'end_date'   => 'date:Y-m-d',
        ];
    }

    /**
     * Auto generate item_code sebelum data disimpan.
     */
    protected static function booted(): void
    {
        static::saving(function (Motor $motor) {
            $type  = strtoupper(trim((string) $motor->type_code));
            $color = strtoupper(trim((string) $motor->color_code));

            $motor->type_code  = $type;
            $motor->color_code = $color;
            if (empty($motor->item_code)) {
                $motor->item_code = "{$type}-{$color}";
            } else {
                $motor->item_code = strtoupper(trim((string) $motor->item_code));
            }
        });
    }
}