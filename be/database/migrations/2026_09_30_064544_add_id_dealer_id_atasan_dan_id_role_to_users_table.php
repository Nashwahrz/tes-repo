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
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('fk_dealer')
                ->nullable()
                ->after('id')
                ->constrained('master.dealers')
                ->nullOnDelete();

            $table->foreignId('fk_atasan')
                ->nullable()
                ->after('fk_dealer')
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId('fk_role')
                ->after('fk_atasan')
                ->constrained('hak_akses.roles')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('fk_atasan');
            $table->dropConstrainedForeignId('fk_dealer');
            $table->dropConstrainedForeignId('fk_role');
        });
    }
};
