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
            $table->string('name')->unique();
            $table->foreignId('id_provinsi')
                ->nullable()
                ->after('id')
                ->constrained('master.provinsis')
                ->nullOnDelete();
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
