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
            $table->foreignId('id_dealer')
                ->nullable()
                ->after('id')
                ->constrained('dealers')
                ->nullOnDelete();

            $table->foreignId('id_atasan')
                ->nullable()
                ->after('dealer_id')
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId('id_role')
                ->nullable()
                ->after('id')
                ->constrained('roles')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('id_atasan');
            $table->dropConstrainedForeignId('id_dealer');
            $table->dropConstrainedForeignId('id_role');
        });
    }
};
