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
            ['nama_menu' => 'Daftar Konsumen',  'url' => 'konsumens',         'urutan' => 9, 'status' => true],
            ['nama_menu' => 'Email WhiteList',  'url' => 'email-whitelists',  'urutan' => 10, 'status' => true],
            ['nama_menu' => 'Log Aktivitas',    'url' => 'log-aktivitas',     'urutan' => 11, 'status' => true],
            ['nama_menu' => 'Log Users Login',  'url' => 'log-users',         'urutan' => 12, 'status' => true],
            ['nama_menu' => 'Daftar Agama',     'url' => 'agamas',            'urutan' => 13, 'status' => true],
            ['nama_menu' => 'Daftar Pekerjaan', 'url' => 'pekerjaans',          'urutan' => 14, 'status' => true],
            ['nama_menu' => 'Daftar Provinsi','url' => 'provinsis',           'urutan' => 15, 'status' => true],
            ['nama_menu' => 'Daftar Kabupaten/Kota','url' => 'kabupaten-kotas',           'urutan' => 16, 'status' => true],
            ['nama_menu' => 'Daftar Kecamatan','url' => 'kecamatans',           'urutan' => 17, 'status' => true],
            ['nama_menu' => 'Daftar Kelurahan','url' => 'kelurahans',           'urutan' => 18, 'status' => true],
            ['nama_menu' => 'Setting rate limit','url' => 'configurasi-rate-limits',           'urutan' => 19, 'status' => true],
            
        ];
         $menus = array_map(fn ($m) => $m + [
                'created_at' => $now,
                'updated_at' => $now,
            ], $menus);

            DB::table('hak_akses.menus')->upsert(
                $menus,
                ['url'],                                   
                ['nama_menu', 'urutan', 'status', 'updated_at']
            );

    }
}
