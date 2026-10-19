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
        Schema::create('hak_akses.menu_roles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_role')->constrained('hak_akses.roles')->cascadeOnDelete();
            $table->foreignId('id_menu')->constrained('hak_akses.menus')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hak_akses.menu_roles');
    }
};
