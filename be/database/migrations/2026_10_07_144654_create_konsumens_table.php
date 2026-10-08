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
        $table->string('nik', 16)->unique(); 
        $table->string('name');
        $table->string('tmp_lahir');
        $table->date('tgl_lahir');
        $table->enum('jenis_kelamin', ['Laki-laki', 'Perempuan']);
        $table->string('alamat');
        $table->string('rt', 3);    
        $table->string('rw', 3);
        $table->string('desa_kelurahan');
        $table->string('kecamatan');
        $table->string('kabupaten_kota');
        $table->string('provinsi');
        $table->string('agama');
        $table->string('status_perkawinan');
        $table->string('pekerjaan');
        $table->string('kewarganegaraan');
        $table->string('no_telp', 20);
        $table->string('email');
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
