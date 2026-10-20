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
        $table->foreignId('id_tmp_lahir')
                ->nullable()
                ->after('id')
                ->constrained('master.kabupaten_kotas')
                ->nullOnDelete();
        $table->date('tgl_lahir');
        $table->string('jenis_kelamin');
        $table->string('alamat');
        $table->decimal('latitude', 10, 7)->nullable();
        $table->decimal('longitude', 10, 7)->nullable();
        $table->string('rt', 3);    
        $table->string('rw', 3);
        $table->foreignId('id_kelurahan')
                ->nullable()
                ->after('id')
                ->constrained('master.kelurahans')
                ->nullOnDelete();
        $table->foreignId('id_kecamatan')
                ->nullable()
                ->after('id')
                ->constrained('master.kecamatans')
                ->nullOnDelete();
        $table->foreignId('id_kabupaten_kota')
                ->nullable()
                ->after('id')
                ->constrained('master.kabupaten_kotas')
                ->nullOnDelete();
        $table->foreignId('id_provinsi')
                ->nullable()
                ->after('id')
                ->constrained('master.provinsis')
                ->nullOnDelete();
        $table->foreignId('id_agama')
                ->nullable()
                ->after('id')
                ->constrained('master.agamas')
                ->nullOnDelete();
        $table->string('status_perkawinan');
        $table->foreignId('id_pekerjaan')
                ->nullable()
                ->after('id')
                ->constrained('master.pekerjaans')
                ->nullOnDelete();
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
