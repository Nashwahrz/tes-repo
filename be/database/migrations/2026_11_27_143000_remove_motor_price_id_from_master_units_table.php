<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('master.master_units', 'motor_price_id')) {
            $foreignKeys = Schema::getForeignKeys('master.master_units');

            Schema::table('master.master_units', function (Blueprint $table) use ($foreignKeys) {
                foreach ($foreignKeys as $fk) {
                    if (in_array('motor_price_id', $fk['columns'] ?? [], true) && ! empty($fk['name'])) {
                        $table->dropForeign($fk['name']);
                    }
                }

                $table->dropColumn('motor_price_id');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasColumn('master.master_units', 'motor_price_id')) {
            Schema::table('master.master_units', function (Blueprint $table) {
                $table->foreignId('motor_price_id')
                    ->nullable()
                    ->constrained('master.motor_prices')
                    ->cascadeOnUpdate()
                    ->nullOnDelete();
            });
        }
    }
};
