<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('master.motors', function (Blueprint $table) {
            $table->id();
            // item_code: gabungan type_code + color_code (SKU unik, length: 6)
            $table->string('item_code', 6)->unique();
            $table->string('type_code', 3)->index();
            $table->string('type_description', 25);
            $table->string('color_code', 2)->index();
            $table->string('color_description', 15);
            $table->string('market_name', 25)->index();
            $table->string('class', 1)->index(); 
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->timestamps();

            // Constraint unik kombinasi type_code & color_code
            $table->unique(['type_code', 'color_code'], 'motors_type_color_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('master.motors');
    }
};
