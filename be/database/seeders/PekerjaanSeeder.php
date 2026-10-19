<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PekerjaanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $data = [
            'Jasa',
            'Perdagangan(Retail)',
            'Wiraswasta/Pedagang',
            'Pertanian/Perkebunan/Kehutanan/Perikanan/Peternakan',
            'Industri',
            'Konstruksi',
            'Pertambangan',
            'Mahasiswa/Pelajar',
            'TNI/Polri',
            'Ibu Rumah Tangga',
            'Pegawai Negri',
            'Profesional Dokter/Pengacara',
            'Dokter/Bidan/Mantri',
            'Pengacara',
            'Wartawan/Transportasi/Komunikasi',
            'Nelayan',
            'Pegawai Swasta',
            'Ojek',
            'Petani/Nelayan',
            'Petani',
            'Guru/Dosen',
            'Lain-lain',
        ];

        foreach ($data as $name) {
            DB::table('pekerjaans')->updateOrInsert(
                ['name' => $name],
                ['created_at' => now(), 'updated_at' => now()]
            );
        }
    }
}