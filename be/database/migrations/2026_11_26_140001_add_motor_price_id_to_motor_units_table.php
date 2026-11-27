<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('motor_units', function (Blueprint $table) {
            $table->foreignId('motor_price_id')
                ->nullable()
                ->after('item_code')
                ->constrained('master.motor_prices')
                ->cascadeOnUpdate()
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('motor_units', function (Blueprint $table) {
            $table->dropForeign(['motor_price_id']);
            $table->dropColumn('motor_price_id');
        });
    }
};
