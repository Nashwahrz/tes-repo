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
        ];
        $rows = array_map(fn ($nama) => [
            'nama_permission' => $nama,
            'created_at'      => $now,
            'updated_at'      => $now,
        ], $daftar);
 
        DB::table('permissions')->upsert($rows, ['nama_permission'], ['updated_at']);
    }
}
