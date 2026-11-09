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
        Schema::create('master.kelurahans', function (Blueprint $table) {
            $table->id();
            $table->string('kelurahan_code')->unique();
            $table->string('kelurahan_name');
            $table->string('fk_kecamatan')->nullable();
            $table->foreign('fk_kecamatan')
                ->references('kecamatan_code')
                ->on('master.kecamatans')
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
        Schema::dropIfExists('master.kelurahans');
    }
};
