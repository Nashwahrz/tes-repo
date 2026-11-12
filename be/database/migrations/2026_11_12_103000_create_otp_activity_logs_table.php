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
        Schema::create('log.log_activity_otps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fk_user')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->string('email');
            $table->string('purpose', 50)->index();
            $table->string('action', 50)->index();
            $table->text('description')->nullable();
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
        Schema::dropIfExists('log.log_activity_otps');
    }
};

