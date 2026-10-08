<?php

namespace Database\Seeders;

use App\Enums\StatusUser;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ManagerSeeder extends Seeder
{
    public function run(): void
    {

        User::updateOrCreate(
            ['email' => 'manager@gmail.com'],  
            [
                'name'     => 'Manager',
                'password' => Hash::make('Password-123'),
                'id_role'  => 1,
                'status'   => StatusUser::Aktif->value,
                'email_verifikasi' => true
            ]
        );
    }
}