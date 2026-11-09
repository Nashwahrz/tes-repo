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
        DB::table('otps')->truncate();
        Schema::table('otps', function (Blueprint $table) {
            $table->string('purpose', 30)->after('fk_user');
            $table->timestamp('otp_expires_at')->nullable(false)->change();

            $table->unique(['fk_user', 'purpose']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('otps', function (Blueprint $table) {
            $table->dropUnique(['fk_user', 'purpose']);
            $table->dropColumn(['purpose', 'attempts', 'used_at']);
            $table->timestamp('otp_expires_at')->nullable()->change();
        });
    }
};
