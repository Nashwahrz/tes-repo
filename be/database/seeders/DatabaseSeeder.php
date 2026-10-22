<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
           
            RoleSeeder::class,
            ConfigurasiRateLimitSeeder::class,
            EmailSmtpSeeder::class,
            PermissionSeeder::class,
            MenuSeeder::class,
            RoleMenuSeeder::class,
            RolePermissionSeeder::class,
            SuperAdminSeeder::class,
            EmailWhiteListSeeder::class,
            PekerjaanSeeder::class,
            AgamaSeeder::class,
            ProvinsiSeeder::class,
            KabupatenKotaSeeder::class,
            KecamatanSeeder::class,
            KelurahanSeeder::class,
        ]);
    }
}