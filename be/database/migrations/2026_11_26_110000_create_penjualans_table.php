<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('penjualans', function (Blueprint $table) {
            $table->id();
            $table->string('no_transaksi', 50)->unique();
            $table->date('tanggal_transaksi')->index();
            $table->foreignId('dealer_id')->constrained('master.dealers')->cascadeOnUpdate()->restrictOnDelete();
            $table->foreignId('konsumen_id')->constrained('konsumens')->cascadeOnUpdate()->restrictOnDelete();
            $table->foreignId('motor_unit_id')->constrained('motor_units')->cascadeOnUpdate()->restrictOnDelete();
            $table->string('item_code', 6);
            $table->foreignId('sales_id')->constrained('users')->cascadeOnUpdate()->restrictOnDelete();
            $table->foreignId('kasir_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('metode_pembayaran', 20)->default('CASH');
            $table->decimal('harga_otr', 15, 2)->default(0);
            $table->decimal('diskon', 15, 2)->default(0);
            $table->decimal('uang_muka', 15, 2)->default(0);
            $table->decimal('total_harga', 15, 2)->default(0);
            $table->string('nama_leasing', 100)->nullable();
            $table->integer('tenor_bulan')->nullable();
            $table->decimal('angsuran_per_bulan', 15, 2)->nullable();
            $table->string('status', 30)->default('MENUNGGU_PEMBAYARAN')->index();
            $table->timestamp('tanggal_lunas')->nullable();
            $table->text('alasan_batal')->nullable();
            $table->text('catatan')->nullable();
            $table->timestamps();

            $table->foreign('item_code')->references('item_code')->on('master.motors')->cascadeOnUpdate()->restrictOnDelete();
            $table->index(['dealer_id', 'status', 'tanggal_transaksi'], 'penjualans_dealer_status_tgl_idx');
            $table->index(['motor_unit_id', 'status'], 'penjualans_unit_status_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('penjualans');
    }
};
