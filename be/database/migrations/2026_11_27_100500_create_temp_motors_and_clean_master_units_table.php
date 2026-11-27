<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('temp.temp_motors')) {
            Schema::create('temp.temp_motors', function (Blueprint $table) {
                $table->id();
                $table->foreignId('master_unit_id')
                    ->unique()
                    ->constrained('master.master_units')
                    ->cascadeOnUpdate()
                    ->cascadeOnDelete();
                $table->foreignId('dikunci_oleh')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('dikunci_sampai')->nullable()->index();
                $table->text('catatan')->nullable();
                $table->timestamps();
            });
        }

        // Pindahkan data kunci yang sudah ada di master.master_units ke temp.temp_motors
        $lockedRows = DB::table('master.master_units')
            ->where(function ($q) {
                $q->whereNotNull('dikunci_oleh')
                    ->orWhereNotNull('dikunci_sampai');
            })
            ->where('status', 'RESERVED')
            ->get();

        $now = now();
        foreach ($lockedRows as $row) {
            DB::table('temp.temp_motors')->updateOrInsert(
                ['master_unit_id' => $row->id],
                [
                    'dikunci_oleh'   => $row->dikunci_oleh,
                    'dikunci_sampai' => $row->dikunci_sampai,
                    'created_at'     => $now,
                    'updated_at'     => $now,
                ]
            );
        }

        DB::statement('ALTER TABLE master.master_units DROP CONSTRAINT IF EXISTS motor_units_dikunci_oleh_foreign');
        DB::statement('ALTER TABLE master.master_units DROP CONSTRAINT IF EXISTS master_master_units_dikunci_oleh_foreign');
        DB::statement('ALTER TABLE master.master_units DROP COLUMN IF EXISTS dikunci_oleh');
        DB::statement('ALTER TABLE master.master_units DROP COLUMN IF EXISTS dikunci_sampai');
    }

    public function down(): void
    {
        Schema::table('master.master_units', function (Blueprint $table) {
            $table->foreignId('dikunci_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('dikunci_sampai')->nullable()->index();
        });

        $temps = DB::table('temp.temp_motors')->get();
        foreach ($temps as $temp) {
            DB::table('master.master_units')
                ->where('id', $temp->master_unit_id)
                ->update([
                    'dikunci_oleh'   => $temp->dikunci_oleh,
                    'dikunci_sampai' => $temp->dikunci_sampai,
                ]);
        }

        Schema::dropIfExists('temp.temp_motors');
    }
};
