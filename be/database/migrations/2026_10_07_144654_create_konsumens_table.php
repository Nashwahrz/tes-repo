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
        $table->foreignId('id_me')->constrained('users')->cascadeOnDelete();
        $table->string('nik', 16)->nullable()->unique(); 
        $table->string('name')->nullable();
        $table->string('tmp_lahir')->nullable();
        $table->date('tgl_lahir')->nullable();
        $table->enum('jenis_kelamin', ['Laki-laki', 'Perempuan'])->nullable();
        $table->string('alamat')->nullable();
        $table->string('rt', 3)->nullable();
        $table->string('rw', 3)->nullable();
        $table->string('desa_kelurahan')->nullable();
        $table->string('kecamatan')->nullable();
        $table->string('kabupaten_kota')->nullable();
        $table->string('provinsi')->nullable();
        $table->string('agama')->nullable();
        $table->string('status_perkawinan')->nullable();
        $table->string('pekerjaan')->nullable();
        $table->string('kewarganegaraan')->nullable();
        $table->string('no_telp', 20)->nullable();
        $table->string('email')->nullable();
        $table->string('foto_ktp');
        $table->enum('status', ['pending', 'diterima', 'ditolak'])
            ->default('pending');
        $table->text('catatan_penolakan')->nullable();
        $table->foreignId('diverifikasi_oleh')->nullable()->constrained('users')->nullOnDelete();
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
