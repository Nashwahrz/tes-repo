<?php

namespace Database\Seeders;

use Illuminate\Support\Facades\DB;
use Illuminate\Database\Seeder;

class EmailWhiteListSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = now();
        $daftar = [
            ['domain' => '@gmail.com', 'is_active' => true, 'created_by' => 1],
            ['domain' => '@yahoo.com', 'is_active' => true, 'created_by' => 1],
        ];

        $rows = array_map(fn($item) => $item + ['created_at' => $now, 'updated_at' => $now], $daftar);

        DB::table('master.email_whitelists')->upsert(
            $rows,
            ['domain'],
            ['is_active', 'created_by', 'updated_at']
        );
    }
}
