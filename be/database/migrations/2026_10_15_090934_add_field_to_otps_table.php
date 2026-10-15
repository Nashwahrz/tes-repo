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
            $table->string('purpose', 30)->after('id_user');
            $table->timestamp('expires_at')->nullable(false)->change();

            $table->unique(['id_user', 'purpose']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('otps', function (Blueprint $table) {
            $table->dropUnique(['id_user', 'purpose']);
            $table->dropColumn(['purpose', 'attempts', 'used_at']);
            $table->timestamp('expires_at')->nullable()->change();
        });
    }
};
