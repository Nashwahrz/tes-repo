<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('master.kecamatans', function (Blueprint $table) {
            $table->id();
            $table->string('kecamatan_code')->unique();
            $table->string('kecamatan_name');
            $table->string('fk_kabupaten_kota')->nullable();
            $table->foreign('fk_kabupaten_kota')
                ->references('kabupaten_kota_code')
                ->on('master.kabupaten_kotas')
                ->nullOnDelete();
            $table->boolean('status')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('master.kacamatans');
    }
};
