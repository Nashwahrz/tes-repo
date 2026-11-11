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
        Schema::create('master.pekerjaans', function (Blueprint $table) {
            $table->id();
           // $table->string('id_md');
            $table->string('pekerjaan_code')->unique();
            $table->string('pekerjaan_name');
            $table->integer('sequence');
            $table->string('type_header');
            $table->string('sector_job');
            $table->integer('id_parent');
            $table->boolean('status')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('master.pekerjaans');
    }
};
