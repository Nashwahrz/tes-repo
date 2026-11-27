<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE public.motor_unit_movements SET SCHEMA log');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE log.motor_unit_movements SET SCHEMA public');
    }
};
