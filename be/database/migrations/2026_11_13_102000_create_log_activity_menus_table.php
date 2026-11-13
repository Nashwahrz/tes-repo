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
        Schema::create('log.log_activity_menus', function (Blueprint $table) {
            $table->id();
            $table->string('action')->index();
            $table->foreignId('fk_role')
                ->nullable()
                ->constrained('hak_akses.roles')
                ->nullOnDelete();
            $table->string('role_name')->nullable();
            // $table->foreignId('fk_menu')
            //     ->nullable()
            //     ->constrained('hak_akses.menus')
            //     ->nullOnDelete();
            // $table->string('menu_name')->nullable();
            $table->foreignId('fk_causer')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->string('causer_name')->nullable();
            $table->text('description')->nullable();
            $table->jsonb('old_data')->nullable();
            $table->jsonb('new_data')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('created_at')->useCurrent()->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('log.log_activity_menus');
    }
};

