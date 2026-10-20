<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = now();

        $akses = [
            'Super Admin' => [
                'dealers.lihat',
                'dealers.tambah',
                'dealers.ubah',
                'dealers.hapus',
                'users.lihat',
                'users.aktivasi',
                'role-menus.kelola',
                'role-permissions.kelola',
                'konsumens.lihat',
                'konsumens.tambah',
                'konsumens.ubah',
                'konsumens.hapus',
                'konsumens.scan',
                'konsumens.logs',
                'email-whitelists.lihat',
                'email-whitelists.tambah',
                'email-whitelists.ubah',
                'email-whitelists.hapus',
                'log-users.lihat',
                'agamas.lihat',
                'agamas.tambah',
                'agamas.ubah',
                'agamas.hapus',
                'pekerjaans.lihat',
                'pekerjaans.tambah',
                'pekerjaans.ubah',
                'pekerjaans.hapus',
                'provinsis.lihat',
                'provinsis.tambah',
                'provinsis.ubah',
                'provinsis.hapus',
                'kabupaten-kotas.lihat',
                'kabupaten-kotas.tambah',
                'kabupaten-kotas.ubah',
                'kabupaten-kotas.hapus',
                'kecamatans.lihat',
                'kecamatans.tambah',
                'kecamatans.ubah',
                'kecamatans.hapus',
                'kelurahans.lihat',
                'kelurahans.tambah',
                'kelurahans.ubah',
                'kelurahans.hapus',
            ],
            'Kacab' => [
                'dealers.lihat',
                'dealers.tambah',
                'dealers.ubah',
                'users.lihat',
                'konsumens.lihat',
                'konsumens.tambah',
                'konsumens.ubah',
                'konsumens.hapus',
                'konsumens.scan',
                'konsumens.aktivasi',
                'agamas.lihat',
                'pekerjaans.lihat',
                'provinsis.lihat',
                'kabupaten-kotas.lihat',
                'kecamatans.lihat',
                'kelurahans.lihat',
            ],
            'ADH' => [
                'dealers.lihat',
                'users.lihat',
                'users.aktivasi',
                'konsumens.lihat',
                'konsumens.tambah',
                'konsumens.ubah',
                'konsumens.hapus',
                'konsumens.scan',
                'agamas.lihat',
                'pekerjaans.lihat',
                'provinsis.lihat',
                'kabupaten-kotas.lihat',
                'kecamatans.lihat',
                'kelurahans.lihat',
            ],
            'ME' => [
                'dealers.lihat',
                'konsumens.lihat',
                'konsumens.tambah',
                'konsumens.ubah',
                'konsumens.hapus',
                'konsumens.scan',
                'agamas.lihat',
                'pekerjaans.lihat',
                'provinsis.lihat',
                'kabupaten-kotas.lihat',
                'kecamatans.lihat',
                'kelurahans.lihat',
            ],
            'Kasir' => [
                'dealers.lihat',
                'konsumens.lihat',
                'konsumens.scan',
                'konsumens.tambah',
                'agamas.lihat',
                'pekerjaans.lihat',
                'provinsis.lihat',
                'kabupaten-kotas.lihat',
                'kecamatans.lihat',
                'kelurahans.lihat',
            ],
        ];
        foreach ($akses as $namaRole => $daftarPermission) {
            $idRole = DB::table('hak_akses.roles')->where('name', $namaRole)->value('id');
 
            if (! $idRole) {
                $this->command?->warn("Role '{$namaRole}' tidak ditemukan, dilewati.");
                continue;
            }
 
            $idPermissions = DB::table('hak_akses.permissions')
                ->whereIn('nama_permission', $daftarPermission)
                ->pluck('id');
 
            if ($idPermissions->count() !== count($daftarPermission)) {
                $this->command?->warn("Ada permission untuk role '{$namaRole}' yang belum ada di tabel permissions.");
            }
            $rows = $idPermissions->map(fn ($idPermission) => [
                'id_role'       => $idRole,
                'id_permission' => $idPermission,
                'created_at' => $now,
                'updated_at' => $now,
            ])->all();
 
            DB::table('hak_akses.permission_roles')->insert($rows);
 
            $this->command?->info("{$namaRole}: {$idPermissions->count()} permission.");
        }   
    }
}
