<?php

namespace App\Http\Requests;

use App\Enums\JenisKelamin;
use App\Models\Agama;
use App\Models\KabupatenKota;
use App\Models\Kecamatan;
use App\Models\Kelurahan;
use App\Models\Konsumen;
use App\Models\Pekerjaan;
use App\Models\Provinsi;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;

class KonsumenRequest extends FormRequest
{
    public function rules(): array
    {
        $isUpdate   = $this->isMethod('put') || $this->isMethod('patch');
        $konsumenId = $this->route('id') ?? $this->route('konsumen');

        $nik       = $this->input('nik');
        $nikExists = !$isUpdate && !empty($nik) && Konsumen::where('nik', $nik)->exists();
        $nikRules = ['required', 'string', 'digits:16'];
        if ($isUpdate) {
            $nikRules[] = Rule::unique('konsumens', 'nik')->ignore($konsumenId);
        }

        if ($this->hasFile('foto_ktp')) {
            $fotoKtpRules = ['nullable', 'image', 'mimes:jpg,jpeg,png', 'max:2048'];
        } elseif ($isUpdate || $nikExists) {
            $fotoKtpRules = ['nullable', 'string'];
        } else {
            $fotoKtpRules = ['required', 'image', 'mimes:jpg,jpeg,png', 'max:2048'];
        }

        return [
            'foto_ktp'  => $fotoKtpRules,
            'nik'       => $nikRules,
            'name'      => ['required', 'string', 'max:255'],
            'tgl_lahir' => ['required', 'date'],
            'jenis_kelamin' => ['required', Rule::enum(JenisKelamin::class)],
            'alamat'    => ['required', 'string', 'max:255'],
            'latitude'  => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'rt'        => ['required', 'string', 'max:3'],
            'rw'        => ['required', 'string', 'max:3'],

            'kode_tmp_lahir' => ['required', 'string',
                Rule::exists(KabupatenKota::class, 'kode')->where('status', true)],

            'kode_provinsi' => ['required', 'string',
                Rule::exists(Provinsi::class, 'kode')->where('status', true)],

            'kode_kabupaten_kota' => ['required', 'string',
                Rule::exists(KabupatenKota::class, 'kode')
                    ->where('kode_provinsi', $this->input('kode_provinsi'))
                    ->where('status', true)],

            'kode_kecamatan' => ['required', 'string',
                Rule::exists(Kecamatan::class, 'kode')
                    ->where('kode_kabupaten_kota', $this->input('kode_kabupaten_kota'))
                    ->where('status', true)],

            'kode_kelurahan' => ['required', 'string',
                Rule::exists(Kelurahan::class, 'kode')
                    ->where('kode_kecamatan', $this->input('kode_kecamatan'))
                    ->where('status', true)],

            'kode_agama'     => ['required', 'string', Rule::exists(Agama::class, 'kode')->where('status', true)],
            'kode_pekerjaan' => ['required', 'string', Rule::exists(Pekerjaan::class, 'kode')->where('status', true)],

            'status_perkawinan' => ['required', 'string', 'max:50'],
            'kewarganegaraan'   => ['required', 'string', 'max:50'],
            'no_telp'           => ['required', 'string', 'max:20'],
            'email'             => ['required', 'email', 'max:255'],
        ];
    }

    public function attributes(): array
    {
        return [
            'foto_ktp'            => 'foto KTP',
            'nik'                 => 'NIK',
            'name'                => 'nama',
            'kode_tmp_lahir'      => 'tempat lahir',
            'tgl_lahir'           => 'tanggal lahir',
            'jenis_kelamin'       => 'jenis kelamin',
            'rt'                  => 'RT',
            'rw'                  => 'RW',
            'kode_kelurahan'      => 'kelurahan',
            'kode_kecamatan'      => 'kecamatan',
            'kode_kabupaten_kota' => 'kabupaten/kota',
            'kode_provinsi'       => 'provinsi',
            'kode_agama'          => 'agama',
            'kode_pekerjaan'      => 'pekerjaan',
            'status_perkawinan'   => 'status perkawinan',
            'no_telp'             => 'nomor telepon',
        ];
    }

    public function messages(): array
    {
        return [

            'required' => ':attribute wajib diisi.',
            'string'   => ':attribute harus berupa teks.',
            'date'     => 'Format :attribute tidak valid.',
            'numeric'  => ':attribute harus berupa angka.',
            'email'    => 'Format :attribute tidak valid.',
            'max'      => [
                'string'  => ':attribute maksimal :max karakter.',
                'file'    => 'Ukuran :attribute maksimal :max KB.',
            ],
            'between'  => [
                'numeric' => ':attribute harus di antara :min dan :max.',
            ],

            'foto_ktp.image'    => 'Foto KTP harus berupa gambar.',
            'foto_ktp.mimes'    => 'Format foto KTP harus JPG, JPEG, atau PNG.',
            'foto_ktp.max'      => 'Ukuran foto KTP maksimal 2 MB.',
            'foto_ktp.uploaded' => 'Foto KTP gagal diunggah, coba lagi.',

            'nik.digits' => 'NIK harus terdiri dari 16 digit angka.',
            'nik.unique' => 'NIK sudah terdaftar.',

            'jenis_kelamin.enum' => 'Jenis kelamin tidak valid.',

            'rt.max' => 'RT maksimal 3 karakter.',
            'rw.max' => 'RW maksimal 3 karakter.',
            'no_telp.max' => 'Nomor telepon maksimal 20 karakter.',

     
            'kode_tmp_lahir.exists'      => 'Tempat lahir tidak valid.',
            'kode_provinsi.exists'       => 'Provinsi tidak valid.',
            'kode_kabupaten_kota.exists' => 'Kabupaten/kota tidak valid atau tidak sesuai dengan provinsi yang dipilih.',
            'kode_kecamatan.exists'      => 'Kecamatan tidak valid atau tidak sesuai dengan kabupaten/kota yang dipilih.',
            'kode_kelurahan.exists'      => 'Kelurahan tidak valid atau tidak sesuai dengan kecamatan yang dipilih.',
            'kode_agama.exists'          => 'Agama tidak valid.',
            'kode_pekerjaan.exists'      => 'Pekerjaan tidak valid.',
        ];
    }

   
    protected function failedValidation(Validator $validator): void
    {
        if (! $this->expectsJson()) {
            parent::failedValidation($validator);
        }

        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => 'Data yang dikirim tidak valid.',
            'errors'  => $validator->errors(),
        ], 422));
    }
}