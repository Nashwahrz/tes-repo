<?php

namespace Database\Seeders;

use Illuminate\Support\Facades\DB;
use Illuminate\Database\Seeder;

class MenuSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = now();
        $menus = [
            ['nama_menu' => 'Dashboard',        'url' => 'dashboard',         'urutan' => 1, 'status' => true],
            ['nama_menu' => 'Daftar Motor',     'url' => 'daftar-motor',      'urutan' => 2, 'status' => true],
            ['nama_menu' => 'Daftar Konsumen',  'url' => 'daftar-konsumen',   'urutan' => 3, 'status' => true],
            ['nama_menu' => 'Penjualan',        'url' => 'penjualan',         'urutan' => 4, 'status' => true],
            ['nama_menu' => 'Laporan Penjualan','url' => 'laporan-penjualan', 'urutan' => 5, 'status' => true],
            ['nama_menu' => 'Manajemen User',   'url' => 'users',             'urutan' => 6, 'status' => true],
            ['nama_menu' => 'Role & Hak Akses', 'url' => 'role-menus',        'urutan' => 7, 'status' => true],
            ['nama_menu' => 'Daftar Dealer',    'url' => 'dealers',           'urutan' => 8, 'status' => true],
            
        ];
         $menus = array_map(fn ($m) => $m + [
                'created_at' => $now,
                'updated_at' => $now,
            ], $menus);

            DB::table('menus')->upsert(
                $menus,
                ['url'],                                   
                ['nama_menu', 'urutan', 'status', 'updated_at']
            );

    }
}
