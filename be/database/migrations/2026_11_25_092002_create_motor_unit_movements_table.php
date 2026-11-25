<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('motor_unit_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('motor_unit_id')->constrained('motor_units')->cascadeOnUpdate()->restrictOnDelete();
            $table->foreignId('motor_stock_id')->constrained('motor_stocks')->cascadeOnUpdate()->restrictOnDelete();
            $table->foreignId('dealer_id')->constrained('master.dealers')->cascadeOnUpdate()->restrictOnDelete();
            $table->string('item_code', 6);
            $table->string('jenis_pergerakan', 30)->index();
            $table->string('status_awal', 30)->nullable();
            $table->string('status_akhir', 30)->index();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('catatan')->nullable();
            $table->timestamp('created_at')->useCurrent()->index();

            $table->foreign('item_code')->references('item_code')->on('master.motors')->cascadeOnUpdate()->restrictOnDelete();
            $table->index(['motor_unit_id', 'created_at'], 'motor_unit_movements_unit_created_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('motor_unit_movements');
    }
};
