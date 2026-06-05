<?php

namespace Database\Seeders;

use App\Models\AdminUser;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        AdminUser::updateOrCreate(
            ['email' => 'admin@anflocor.com'],
            [
                'name'     => 'Super Admin',
                'password' => 'changeme123',
                'role'     => 'superadmin',
            ]
        );
    }
}
