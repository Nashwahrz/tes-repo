<?php


namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RoleMenuSeeder extends Seeder
{
    public function run(): void
    {
        $akses = [
            'Super Admin' => [
                'dashboard',
                'daftar-motor',
                'daftar-konsumen',
                'penjualan',
                'laporan-penjualan',
                'users',
                'role-menus',
                'dealers',
                'konsumens',
                'email-whitelists',
                'log-aktivitas',
                'log-users',
                'agamas',
                'pekerjaans',
                'provinsis',
                'kabupaten-kotas',
                'kecamatans',
                'kelurahans',
                'configurasi-rate-limits',
                'email-smtps',
            ],
            'Kacab' => [
                'dashboard',
                'daftar-motor',
                'daftar-konsumen',
                'penjualan',
                'laporan-penjualan',
                'konsumens',
                'agamas',
                'pekerjaans',
                'provinsis',
                'kabupaten-kotas',
                'kecamatans',
                'kelurahans'
            ],
            'ADH' => [
                'dashboard',
                'daftar-motor',
                'daftar-konsumen',
                'penjualan',
                'laporan-penjualan',
                'users',
                'konsumens',
                'agamas',
                'pekerjaans',
                'provinsis',
                'kabupaten-kotas',
                'kecamatans',
                'kelurahans'
            ],
            'ME' => [
                'dashboard',
                'daftar-motor',
                'daftar-konsumen',
                'penjualan',
                'konsumens',
                'agamas',
                'pekerjaans',
                'provinsis',
                'kabupaten-kotas',
                'kecamatans',
                'kelurahans'
            ],
            'Kasir' => [
                'dashboard',
                'daftar-konsumen',
                'penjualan',
                'konsumens',
                'agamas',
                'pekerjaans',
                'provinsis',
                'kabupaten-kotas',
                'kecamatans',
                'kelurahans'
            ],
        ];

        foreach ($akses as $namaRole => $daftarUrl) {
            $idRole = DB::table('hak_akses.roles')->where('name', $namaRole)->value('id');

            if (! $idRole) {
                $this->command?->warn("Role '{$namaRole}' tidak ditemukan, dilewati.");
                continue;
            }

            $idMenus = DB::table('hak_akses.menus')->whereIn('url', $daftarUrl)->pluck('id');

            if ($idMenus->count() !== count($daftarUrl)) {
                $this->command?->warn("Ada url menu untuk role '{$namaRole}' yang belum ada di tabel menus.");
            }
            DB::table('hak_akses.menu_roles')->where('id_role', $idRole)->delete();

            $rows = $idMenus->map(fn ($idMenu) => [
                'id_role' => $idRole,
                'id_menu' => $idMenu,
                'created_at' => now(),
                'updated_at' => now(),
            ])->all();

            DB::table('hak_akses.menu_roles')->insert($rows);
        }
    }
}

