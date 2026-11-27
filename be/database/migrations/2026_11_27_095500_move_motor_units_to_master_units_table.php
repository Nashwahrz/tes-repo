<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE public.motor_units SET SCHEMA master');
        DB::statement('ALTER TABLE master.motor_units RENAME TO master_units');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE master.master_units RENAME TO motor_units');
        DB::statement('ALTER TABLE master.motor_units SET SCHEMA public');
    }
};
