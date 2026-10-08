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
            'Manager' => [
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
            ],
            'ME' => [
                'dealers.lihat',
                'konsumens.lihat',
                'konsumens.tambah',
                'konsumens.ubah',
                'konsumens.hapus',
                'konsumens.scan',
            ],
            'Kasir' => [
                'dealers.lihat',
                'konsumens.lihat',
                'konsumens.scan',
                'konsumens.tambah',
            ],
        ];
        foreach ($akses as $namaRole => $daftarPermission) {
            $idRole = DB::table('roles')->where('name', $namaRole)->value('id');
 
            if (! $idRole) {
                $this->command?->warn("Role '{$namaRole}' tidak ditemukan, dilewati.");
                continue;
            }
 
            $idPermissions = DB::table('permissions')
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
 
            DB::table('role_permissions')->insert($rows);
 
            $this->command?->info("{$namaRole}: {$idPermissions->count()} permission.");
        }   
    }
}
