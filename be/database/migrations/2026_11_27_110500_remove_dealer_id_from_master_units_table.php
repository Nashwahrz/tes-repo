<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Hapus dealer_id dari master.master_units (dealer_id nanti diisi saat penjualan)
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

        // 2. Izinkan dealer_id NULL di motor_stocks untuk stok pusat sebelum terjual ke dealer
        Schema::table('motor_stocks', function (Blueprint $table) {
            $table->foreignId('dealer_id')->nullable()->change();
        });

        // 3. Izinkan dealer_id NULL di log.log_motor_unit_movements
        Schema::table('log.log_motor_unit_movements', function (Blueprint $table) {
            $table->foreignId('dealer_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('master.master_units', 'dealer_id')) {
            Schema::table('master.master_units', function (Blueprint $table) {
                $table->foreignId('dealer_id')->nullable()->constrained('master.dealers')->cascadeOnUpdate()->restrictOnDelete();
            });
        }
    }
};
