<?php

namespace Database\Seeders;

use App\Enums\StatusUser;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {

        User::updateOrCreate(
            ['email' => 'superadmin@gmail.com'],  
            [
                'name'     => 'Super Admin',
                'password' => Hash::make('Password-123'),
                'id_role'  => 1,
                'status'   => StatusUser::Aktif->value,
                'email_verifikasi' => true
            ]
        );
    }
}