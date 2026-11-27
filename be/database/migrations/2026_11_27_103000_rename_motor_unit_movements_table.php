<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE log.motor_unit_movements RENAME TO log_motor_unit_movements');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE log.log_motor_unit_movements RENAME TO motor_unit_movements');
    }
};
