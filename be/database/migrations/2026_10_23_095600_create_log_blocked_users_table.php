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
        Schema::create('log.log_blocked_users', function (Blueprint $table) {
            $table->id();
            $table->string('email')->nullable()->index();
            $table->string('ip_address', 45)->index();
            $table->string('type', 50)->default('login')->index();
            $table->string('reason')->nullable();
            $table->integer('attempts')->default(1);
            $table->timestamp('blocked_at')->useCurrent();
            $table->timestamp('blocked_until')->index();
            $table->boolean('is_unblocked')->default(false)->index();
            $table->timestamp('unblocked_at')->nullable();
            $table->foreignId('unblocked_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('log.log_blocked_users');
    }
};
