<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('master.master_units', 'dealer_id')) {
            Schema::table('master.master_units', function (Blueprint $table) {
                $table->foreignId('dealer_id')
                    ->nullable()
                    ->after('motor_stock_id')
                    ->constrained('master.dealers')
                    ->cascadeOnUpdate()
                    ->restrictOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('master.master_units', 'dealer_id')) {
            $foreignKeys = Schema::getForeignKeys('master.master_units');

            Schema::table('master.master_units', function (Blueprint $table) use ($foreignKeys) {
                foreach ($foreignKeys as $fk) {
                    if (in_array('dealer_id', $fk['columns'] ?? [], true) && ! empty($fk['name'])) {
                        $table->dropForeign($fk['name']);
                    }
                }

                $table->dropColumn('dealer_id');
            });
        }
    }
};
