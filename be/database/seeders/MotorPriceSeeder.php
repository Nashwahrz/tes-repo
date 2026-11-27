<?php

namespace Database\Seeders;

use App\Models\Motor;
use App\Models\MotorPrice;
use Illuminate\Database\Seeder;

class MotorPriceSeeder extends Seeder
{
    public function run(): void
    {
        $prices = [
            [
                'item_code'      => 'MS2-WH',
                'tahun_produksi' => 2025,
                'harga_kosong'   => 20000000,
                'bbn_tnkb_hitam' => 2200000,
                'bbn_tnkb_merah' => 1500000,
                'status'         => true,
            ],
            [
                'item_code'      => 'MS2-WH',
                'tahun_produksi' => 2026,
                'harga_kosong'   => 20500000,
                'bbn_tnkb_hitam' => 2350000,
                'bbn_tnkb_merah' => 1600000,
                'status'         => true,
            ],
            [
                'item_code'      => 'MS2-BK',
                'tahun_produksi' => 2026,
                'harga_kosong'   => 20500000,
                'bbn_tnkb_hitam' => 2350000,
                'bbn_tnkb_merah' => 1600000,
                'status'         => true,
            ],
            [
                'item_code'      => 'MS2-GN',
                'tahun_produksi' => 2026,
                'harga_kosong'   => 20500000,
                'bbn_tnkb_hitam' => 2350000,
                'bbn_tnkb_merah' => 1600000,
                'status'         => true,
            ],
        ];

        foreach ($prices as $item) {
            if (! Motor::where('item_code', $item['item_code'])->exists()) {
                continue;
            }

            MotorPrice::updateOrCreate(
                [
                    'item_code'      => $item['item_code'],
                    'tahun_produksi' => $item['tahun_produksi'],
                ],
                $item
            );
        }
    }
}
