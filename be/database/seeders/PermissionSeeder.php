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
            'dealers.logs',   
            'users.lihat',      
            'users.aktivasi',
            'users.logs',   
            'role-menus.kelola',       
            'role-permissions.kelola',  
            'konsumens.lihat',
            'konsumens.lihat-semua',
            'konsumens.lihat-dealer',
            'konsumens.tambah',
            'konsumens.ubah',
          //  'konsumens.hapus',
            'konsumens.scan',
            'konsumens.aktivasi',
            'konsumens.logs',
            'email-whitelists.lihat',
            'email-whitelists.tambah',
            'email-whitelists.ubah',
            'email-whitelists.hapus',
            'email-whitelists.logs',
            'log-users.lihat',
            'agamas.lihat',
            'agamas.tambah',
            'agamas.ubah',
            'agamas.hapus',
            'agamas.lihat-aktif',
            'agamas.lihat-non-aktif',
            'agamas.logs',
            'pekerjaans.lihat',
            'pekerjaans.tambah',
            'pekerjaans.ubah',
            'pekerjaans.hapus',
            'pekerjaans.lihat-aktif',
            'pekerjaans.lihat-non-aktif',
            'pekerjaans.logs',
            'provinsis.lihat',
            'provinsis.tambah',
            'provinsis.ubah',
            'provinsis.hapus',
            'provinsis.lihat-aktif',
            'provinsis.lihat-non-aktif',
            'provinsis.logs',
            'kabupaten-kotas.lihat',
            'kabupaten-kotas.tambah',
            'kabupaten-kotas.ubah',
            'kabupaten-kotas.hapus',
            'kabupaten-kotas.lihat-aktif',
            'kabupaten-kotas.lihat-non-aktif',
            'kabupaten-kotas.logs',
            'kecamatans.lihat',
            'kecamatans.tambah',
            'kecamatans.ubah',
            'kecamatans.hapus',
            'kecamatans.lihat-aktif',
            'kecamatans.lihat-non-aktif',
            'kecamatans.logs',
            'kelurahans.lihat',
            'kelurahans.tambah',
            'kelurahans.ubah',
            'kelurahans.hapus',
            'kelurahans.lihat-aktif',
            'kelurahans.lihat-non-aktif',
            'kelurahans.logs',
            'configurasi-rate-limits.lihat',
            'configurasi-rate-limits.ubah',
            'configurasi-rate-limits.logs',
            'email-smtps.lihat',
            'email-smtps.tambah',
            'email-smtps.ubah',
            'email-smtps.hapus',
            'email-smtps.logs',
            'url-ip-logins.lihat',
            'url-ip-logins.ubah',
            'url-ip-logins.logs',
            'app-key-ocrs.lihat',
            'app-key-ocrs.ubah',
            'app-key-ocrs.logs',
            
        ];
        $rows = array_map(fn ($nama) => [
            'permission_name' => $nama,
            'created_at'      => $now,
            'updated_at'      => $now,
        ], $daftar);
 
        DB::table('hak_akses.permissions')->upsert($rows, ['permission_name'], ['updated_at']);
    }
}
