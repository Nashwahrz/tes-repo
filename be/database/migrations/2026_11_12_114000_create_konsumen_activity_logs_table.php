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
        Schema::create('log.log_activity_konsumens', function (Blueprint $table) {
            $table->id();
            $table->string('action', 50)->index();
            $table->foreignId('fk_konsumen')
                ->nullable()
                ->constrained('konsumens')
                ->nullOnDelete();
            $table->foreignId('fk_temp_konsumen')
                ->nullable()
                ->constrained('temp.temp_konsumens')
                ->nullOnDelete();
            $table->string('nik', 16)->index();
            $table->string('konsumen_name');
            $table->foreignId('fk_me')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->string('me_name')->nullable();
            $table->foreignId('fk_causer')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->string('causer_name')->nullable();
            $table->string('status', 50)->index();
            $table->string('type', 50)->nullable();
            $table->text('note')->nullable();
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
        Schema::dropIfExists('log.log_activity_konsumens');
    }
};

