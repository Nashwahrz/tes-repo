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
            $table->string('name');
            $table->foreignId('id_kabupaten_kota')
                ->nullable()
                ->after('id')
                ->constrained('master.kabupaten_kotas')
                ->nullOnDelete();
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
