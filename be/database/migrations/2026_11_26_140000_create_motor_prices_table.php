<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('master.motor_prices', function (Blueprint $table) {
            $table->id();
            $table->string('item_code', 6);
            $table->smallInteger('tahun_produksi')->index();
            $table->decimal('harga_kosong', 15, 2)->default(0);
            $table->decimal('bbn_tnkb_hitam', 15, 2)->default(0);
            $table->decimal('bbn_tnkb_merah', 15, 2)->default(0);
            $table->boolean('status')->default(true)->index();
            $table->timestamps();

            $table->foreign('item_code')
                ->references('item_code')
                ->on('master.motors')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->unique(['item_code', 'tahun_produksi'], 'motor_prices_item_tahun_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('master.motor_prices');
    }
};
