<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('motor_stocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dealer_id')->constrained('master.dealers')->cascadeOnUpdate()->restrictOnDelete();
            $table->string('item_code', 6);
            $table->integer('stok_tersedia')->default(0);      // Unit siap dijual (AVAILABLE)
            $table->integer('stok_dalam_proses')->default(0);  // Unit sedang dikunci/proses jual (RESERVED)
            $table->integer('stok_gudang')->default(0);        // Total fisik di gudang (tersedia + dalam proses)
            $table->integer('stok_terjual')->default(0);       // Unit sudah terjual (SOLD)
            $table->timestamps();

            $table->foreign('item_code')->references('item_code')->on('master.motors')->cascadeOnUpdate()->restrictOnDelete();
            $table->unique(['dealer_id', 'item_code'], 'motor_stocks_dealer_item_code_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('motor_stocks');
    }
};
