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
            $table->foreignId('id_me')->constrained('users')->cascadeOnDelete();
            $table->foreignId('id_konsumen')->nullable()->constrained('konsumens')->nullOnDelete();
            $table->string('tipe')->default('baru'); 
            $table->string('nik', 16)->index();
            $table->string('name');
            $table->string('kode_tmp_lahir')->nullable();
            $table->foreign('kode_tmp_lahir')->references('kode')->on('master.kabupaten_kotas')->nullOnDelete();
            $table->date('tgl_lahir');
            $table->string('jenis_kelamin');
            $table->string('alamat_ktp');
            $table->string('alamat_domisili');
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->string('rt', 3);
            $table->string('rw', 3);
            $table->string('kode_kelurahan')->nullable();
            $table->foreign('kode_kelurahan')->references('kode')->on('master.kelurahans')->nullOnDelete();

            $table->string('kode_kecamatan')->nullable();
            $table->foreign('kode_kecamatan')->references('kode')->on('master.kecamatans')->nullOnDelete();

            $table->string('kode_kabupaten_kota')->nullable();
            $table->foreign('kode_kabupaten_kota')->references('kode')->on('master.kabupaten_kotas')->nullOnDelete();

            $table->string('kode_provinsi')->nullable();
            $table->foreign('kode_provinsi')->references('kode')->on('master.provinsis')->nullOnDelete();

            $table->string('kode_agama')->nullable();
            $table->foreign('kode_agama')->references('kode')->on('master.agamas')->nullOnDelete();

            $table->string('status_perkawinan');

            $table->string('kode_pekerjaan')->nullable();
            $table->foreign('kode_pekerjaan')->references('kode')->on('master.pekerjaans')->nullOnDelete();

            $table->string('kewarganegaraan');
            $table->string('no_telp', 20);
            $table->string('email');
            $table->string('foto_ktp'); 
            $table->string('status')->default('pending')->index(); 
            $table->text('catatan')->nullable();                   
            $table->json('data_sebelumnya')->nullable();            
            $table->foreignId('diverifikasi_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('diverifikasi_at')->nullable();

            $table->timestamps();
        });

        DB::statement("
            CREATE UNIQUE INDEX temp_konsumens_aktif_unique
            ON temp.temp_konsumens (id_me, nik)
            WHERE status IN ('pending', 'revisi')
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('temp.temp_konsumens');
    }
};