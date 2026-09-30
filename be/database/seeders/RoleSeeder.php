<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
    
    $roles = ['Manager', 'Kacab', 'ADH', 'ME', 'Kasir'];

    foreach ($roles as $name) {
        Role::firstOrCreate(['name' => $name]);
    }
    }
}
