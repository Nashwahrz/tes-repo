<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('motor_units', function (Blueprint $table) {
            $table->id();
            $table->foreignId('motor_stock_id')->constrained('motor_stocks')->cascadeOnUpdate()->restrictOnDelete();
            $table->foreignId('dealer_id')->constrained('master.dealers')->cascadeOnUpdate()->restrictOnDelete();
            $table->string('item_code', 6);
            $table->string('nomor_rangka', 50)->unique();
            $table->string('nomor_mesin', 50)->unique();
            $table->string('status', 30)->default('AVAILABLE')->index();
            $table->foreignId('dikunci_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('dikunci_sampai')->nullable()->index();
            $table->timestamp('tanggal_terjual')->nullable();
            $table->timestamps();

            $table->foreign('item_code')->references('item_code')->on('master.motors')->cascadeOnUpdate()->restrictOnDelete();
            $table->index(['dealer_id', 'item_code', 'status'], 'motor_units_dealer_item_status_idx');
            $table->index(['motor_stock_id', 'status'], 'motor_units_stock_status_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('motor_units');
    }
};
