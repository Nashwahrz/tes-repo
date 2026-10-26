<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        
        $now = now();
        $daftar = [
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
            'konsumens.aktivasi',
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
            'configurasi-rate-limits.lihat',
            'configurasi-rate-limits.ubah',
            'email-smtps.lihat',
            'email-smtps.tambah',
            'email-smtps.ubah',
            'email-smtps.hapus',
            'url-ip-logins.lihat',
            'url-ip-logins.ubah',
        ];
        $rows = array_map(fn ($nama) => [
            'nama_permission' => $nama,
            'created_at'      => $now,
            'updated_at'      => $now,
        ], $daftar);
 
        DB::table('hak_akses.permissions')->upsert($rows, ['nama_permission'], ['updated_at']);
    }
}
