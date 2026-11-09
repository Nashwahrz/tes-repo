<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('temp.temp_konsumens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fk_me')->constrained('users')->cascadeOnDelete();
            $table->foreignId('fk_konsumen')->nullable()->constrained('konsumens')->nullOnDelete();
            $table->string('type')->default('tambah'); 
            $table->string('nik', 16)->index();
            $table->string('konsumen_name');
            $table->string('fk_temp_lahir')->nullable();
            $table->foreign('fk_temp_lahir')->references('kabupaten_kota_code')->on('master.kabupaten_kotas')->nullOnDelete();
            $table->date('birth_date');
            $table->string('gender');
            $table->string('ktp_address');
            $table->string('domicile_address');
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->string('rt', 3);
            $table->string('rw', 3);
            $table->string('fk_kelurahan')->nullable();
            $table->foreign('fk_kelurahan')->references('kelurahan_code')->on('master.kelurahans')->nullOnDelete();

            $table->string('fk_kecamatan')->nullable();
            $table->foreign('fk_kecamatan')->references('kecamatan_code')->on('master.kecamatans')->nullOnDelete();

            $table->string('fk_kabupaten_kota')->nullable();
            $table->foreign('fk_kabupaten_kota')->references('kabupaten_kota_code')->on('master.kabupaten_kotas')->nullOnDelete();

            $table->string('fk_provinsi')->nullable();
            $table->foreign('fk_provinsi')->references('provinsi_code')->on('master.provinsis')->nullOnDelete();

            $table->string('fk_agama')->nullable();
            $table->foreign('fk_agama')->references('agama_code')->on('master.agamas')->nullOnDelete();

            $table->string('marital_status');

            $table->string('fk_pekerjaan')->nullable();
            $table->foreign('fk_pekerjaan')->references('pekerjaan_code')->on('master.pekerjaans')->nullOnDelete();
            $table->string('nationality');
            $table->string('phone', 20);
            $table->string('email');
            $table->string('foto_ktp'); 
            $table->string('status')->default('pending')->index();
            $table->text('note')->nullable();
            $table->json('old_data')->nullable();
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();

            $table->timestamps();
        });

        DB::statement("
            CREATE UNIQUE INDEX temp_konsumens_aktif_unique
            ON temp.temp_konsumens (fk_me, nik)
            WHERE status IN ('pending', 'revisi')
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('temp.temp_konsumens');
    }
};