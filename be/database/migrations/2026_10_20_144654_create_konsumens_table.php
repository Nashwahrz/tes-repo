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
       Schema::create('konsumens', function (Blueprint $table) {
        $table->id();
        // $table->foreignId('id_me')->constrained('users')->cascadeOnDelete();
        $table->string('nik', 16)->unique(); 
        $table->string('konsumen_name');
        $table->string('fk_temp_lahir')->nullable();
        $table->foreign('fk_temp_lahir')
                ->references('kabupaten_kota_code')
                ->on('master.kabupaten_kotas')
                ->nullOnDelete();
        $table->date('birth_date');
        $table->string('gender');
        $table->string('ktp_address');
        $table->string('domicile_address');
        $table->decimal('latitude', 10, 7)->nullable();
        $table->decimal('longitude', 10, 7)->nullable();
        $table->string('rt', 3);    
        $table->string('rw', 3);
        $table->string('fk_kelurahan')->nullable();
        $table->foreign('fk_kelurahan')
                ->references('kelurahan_code')
                ->on('master.kelurahans')
                ->nullOnDelete();
        $table->string('fk_kecamatan')->nullable();
        $table->foreign('fk_kecamatan')
                ->references('kecamatan_code')
                ->on('master.kecamatans')
                ->nullOnDelete();
        $table->string('fk_kabupaten_kota')->nullable();
        $table->foreign('fk_kabupaten_kota')
                ->references('kabupaten_kota_code')
                ->on('master.kabupaten_kotas')
                ->nullOnDelete();
        $table->string('fk_provinsi')->nullable();
        $table->foreign('fk_provinsi')
                ->references('provinsi_code')
                ->on('master.provinsis')
                ->nullOnDelete();
        $table->string('fk_agama')->nullable();
        $table->foreign('fk_agama')
                ->references('agama_code')
                ->on('master.agamas')
                ->nullOnDelete();
        $table->string('marital_status');
        $table->string('fk_pekerjaan')->nullable();
        $table->foreign('fk_pekerjaan')
                ->references('pekerjaan_code')
                ->on('master.pekerjaans')
                ->nullOnDelete();
        $table->string('nationality');
        $table->string('phone', 20);
        $table->string('email');
        $table->string('foto_ktp');
        // $table->enum('status', ['pending', 'diterima', 'ditolak'])
        //     ->default('pending');
        // $table->text('catatan_penolakan')->nullable();
        // $table->foreignId('diverifikasi_oleh')->nullable()->constrained('users')->nullOnDelete();
        $table->timestamps();
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('konsumens');
    }
};
