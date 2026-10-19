<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProvinsiSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $data = [
            'Nanggroe Aceh Darussalam',
            'Sumatera Utara',
            'Sumatera Barat',
            'Riau',
            'Jambi',
            'Sumatera Selatan',
            'Bengkulu',
            'Lampung',
            'Bangka-Belitung',
            'Kepulauan Riau',
            'D K I Jakarta',
            'Jawa Barat',
            'Jawa Tengah',
            'D I Yogyakarta',
            'Jawa Timur',
            'Banten',
            'Bali',
            'Nusa Tenggara Barat',
            'Nusa Tenggara Timur',
            'Kalimantan Barat',
            'Kalimantan Tengah',
            'Kalimantan Selatan',
            'Kalimantan Timur',
            'KALIMANTAN UTARA',
            'Sulawesi Utara',
            'Sulawesi Tengah',
            'Sulawesi Selatan',
            'Sulawesi Tenggara',
            'Gorontalo',
            'Sulawesi Barat',
            'Maluku',
            'Maluku Utara',
            'Irian Jaya Barat',
            'Papua',
        ];

        foreach ($data as $name) {
            DB::table('provinsis')->updateOrInsert(
                ['name' => $name],
                ['created_at' => now(), 'updated_at' => now()]
            );
        }
    }
}