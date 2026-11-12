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
            ['menu_name' => 'Dashboard',        'url' => 'dashboard',         'sequence' => 1, 'status' => true],
            ['menu_name' => 'Daftar Motor',     'url' => 'daftar-motor',      'sequence' => 2, 'status' => true],
            ['menu_name' => 'Daftar Konsumen',  'url' => 'daftar-konsumen',   'sequence' => 3, 'status' => true],
            ['menu_name' => 'Penjualan',        'url' => 'penjualan',         'sequence' => 4, 'status' => true],
            ['menu_name' => 'Laporan Penjualan','url' => 'laporan-penjualan', 'sequence' => 5, 'status' => true],
            ['menu_name' => 'Manajemen User',   'url' => 'users',             'sequence' => 6, 'status' => true],
            ['menu_name' => 'Role & Hak Akses', 'url' => 'role-menus',        'sequence' => 7, 'status' => true],
            ['menu_name' => 'Daftar Dealer',    'url' => 'dealers',           'sequence' => 8, 'status' => true],
            ['menu_name' => 'Daftar Konsumen',  'url' => 'konsumens',         'sequence' => 9, 'status' => true],
            ['menu_name' => 'Email WhiteList',  'url' => 'email-whitelists',  'sequence' => 10, 'status' => true],
            ['menu_name' => 'Log Aktivitas',    'url' => 'log-aktivitas',     'sequence' => 11, 'status' => true],
            ['menu_name' => 'Log Users Login',  'url' => 'log-users',         'sequence' => 12, 'status' => true],
            ['menu_name' => 'Daftar Agama',     'url' => 'agamas',            'sequence' => 13, 'status' => true],
            ['menu_name' => 'Daftar Pekerjaan', 'url' => 'pekerjaans',          'sequence' => 14, 'status' => true],
            ['menu_name' => 'Daftar Provinsi','url' => 'provinsis',           'sequence' => 15, 'status' => true],
            ['menu_name' => 'Daftar Kabupaten/Kota','url' => 'kabupaten-kotas',           'sequence' => 16, 'status' => true],
            ['menu_name' => 'Daftar Kecamatan','url' => 'kecamatans',           'sequence' => 17, 'status' => true],
            ['menu_name' => 'Daftar Kelurahan','url' => 'kelurahans',           'sequence' => 18, 'status' => true],
            ['menu_name' => 'Setting rate limit','url' => 'configurasi-rate-limits',           'sequence' => 19, 'status' => true],
            ['menu_name' => 'Email Smtp',       'url' => 'email-smtps',         'sequence' => 20, 'status' => true],
            ['menu_name' => 'url ip login',       'url' => 'url-ip-logins',         'sequence' => 21, 'status' => true],
            ['menu_name' => 'app key ocr',       'url' => 'app-key-ocrs',         'sequence' => 22, 'status' => true],
            ['menu_name' => 'Log OTP',       'url' => 'log-otps',         'sequence' => 23, 'status' => true],
            
        ];
         $menus = array_map(fn ($m) => $m + [
                'created_at' => $now,
                'updated_at' => $now,
            ], $menus);

            DB::table('hak_akses.menus')->upsert(
                $menus,
                ['url'],                                   
                ['menu_name', 'sequence', 'status', 'updated_at']
            );

    }
}
