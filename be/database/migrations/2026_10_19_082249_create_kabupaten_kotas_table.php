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
        Schema::create('master.kabupaten_kotas', function (Blueprint $table) {
            $table->id();
            $table->string('kabupaten_kota_code')->unique();
            $table->string('kabupaten_kota_name');
            $table->string('fk_provinsi')->nullable();
            $table->foreign('fk_provinsi')
                ->references('provinsi_code')
                ->on('master.provinsis')
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
        Schema::dropIfExists('master.kabupaten_kotas');
    }
};
