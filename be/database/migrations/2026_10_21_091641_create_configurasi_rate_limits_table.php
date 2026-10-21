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
        Schema::create('setting.configurasi_rate_limits', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->integer('request_per_minutes');
            $table->integer('minutes');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('setting.configurasi_rate_limits');
    }
};
