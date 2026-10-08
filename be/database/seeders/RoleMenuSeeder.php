<?php


namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RoleMenuSeeder extends Seeder
{
    public function run(): void
    {
        $akses = [
            'Manager' => [
                'dashboard',
                'daftar-motor',
                'daftar-konsumen',
                'penjualan',
                'laporan-penjualan',
                'users',
                'role-menus',
                'dealers',
                'konsumens',
            ],
            'Kacab' => [
                'dashboard',
                'daftar-motor',
                'daftar-konsumen',
                'penjualan',
                'laporan-penjualan',
                'konsumens'
            ],
            'ADH' => [
                'dashboard',
                'daftar-motor',
                'daftar-konsumen',
                'penjualan',
                'laporan-penjualan',
                'users',
                'konsumens',
            ],
            'ME' => [
                'dashboard',
                'daftar-motor',
                'daftar-konsumen',
                'penjualan',
                'konsumens'
            ],
            'Kasir' => [
                'dashboard',
                'daftar-konsumen',
                'penjualan',
                'konsumens'
            ],
        ];

        foreach ($akses as $namaRole => $daftarUrl) {
            $idRole = DB::table('roles')->where('name', $namaRole)->value('id');

            if (! $idRole) {
                $this->command?->warn("Role '{$namaRole}' tidak ditemukan, dilewati.");
                continue;
            }

            $idMenus = DB::table('menus')->whereIn('url', $daftarUrl)->pluck('id');

            if ($idMenus->count() !== count($daftarUrl)) {
                $this->command?->warn("Ada url menu untuk role '{$namaRole}' yang belum ada di tabel menus.");
            }
            DB::table('role_menus')->where('id_role', $idRole)->delete();

            $rows = $idMenus->map(fn ($idMenu) => [
                'id_role' => $idRole,
                'id_menu' => $idMenu,
                'created_at' => now(),
                'updated_at' => now(),
            ])->all();

            DB::table('role_menus')->insert($rows);
        }
    }
}

