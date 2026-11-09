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
use App\Models\TempKonsumen;
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
            $temp = TempKonsumen::find($konsumenId);
            $ignoreKonsumenId = $temp ? $temp->id_konsumen : $konsumenId;
            if ($ignoreKonsumenId) {
                $nikRules[] = Rule::unique('konsumens', 'nik')->ignore($ignoreKonsumenId);
            }
        }

        if ($this->hasFile('foto_ktp')) {
            $fotoKtpRules = ['nullable', 'image', 'mimes:jpg,jpeg,png', 'max:2156'];
        } elseif ($isUpdate || $nikExists) {
            $fotoKtpRules = ['nullable', 'string'];
        } else {
            $fotoKtpRules = ['required', 'image', 'mimes:jpg,jpeg,png', 'max:2156'];
        }

        return [
            'foto_ktp'  => $fotoKtpRules,
            'nik'       => $nikRules,
            'konsumen_name'      => ['required', 'string', 'max:255'],
            'birth_date' => ['required', 'date'],
            'gender' => ['required', Rule::enum(JenisKelamin::class)],
            'ktp_address'    => ['required', 'string', 'max:255'],
            'domicile_address' => ['required', 'string', 'max:255'],
            'latitude'  => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'rt'        => ['required', 'string', 'max:3'],
            'rw'        => ['required', 'string', 'max:3'],

            'fk_temp_lahir' => ['required', 'string',
                Rule::exists(KabupatenKota::class, 'kabupaten_kota_code')->where('status', true)],

            'fk_provinsi' => ['required', 'string',
                Rule::exists(Provinsi::class, 'provinsi_code')->where('status', true)],

            'fk_kabupaten_kota' => ['required', 'string',
                Rule::exists(KabupatenKota::class, 'kabupaten_kota_code')
                    ->where('fk_provinsi', $this->input('fk_provinsi'))
                    ->where('status', true)],

            'fk_kecamatan' => ['required', 'string',
                Rule::exists(Kecamatan::class, 'kecamatan_code')
                    ->where('fk_kabupaten_kota', $this->input('fk_kabupaten_kota'))
                    ->where('status', true)],

            'fk_kelurahan' => ['required', 'string',
                Rule::exists(Kelurahan::class, 'kelurahan_code')
                    ->where('fk_kecamatan', $this->input('fk_kecamatan'))
                    ->where('status', true)],

            'fk_agama'     => ['required', 'string', Rule::exists(Agama::class, 'agama_code')->where('status', true)],
            'fk_pekerjaan' => ['required', 'string', Rule::exists(Pekerjaan::class, 'pekerjaan_code')->where('status', true)],

            'marital_status' => ['required', 'string', 'max:50'],
            'nationality'   => ['required', 'string', 'max:50'],
            'phone'           => ['required', 'string', 'max:20'],
            'email'             => ['required', 'email', 'max:255'],
        ];
    }

    public function attributes(): array
    {
        return [
            'foto_ktp'            => 'foto KTP',
            'nik'                 => 'NIK',
            'konsumen_name'      => 'nama',
            'birth_date'           => 'tanggal lahir',
            'gender'       => 'jenis kelamin',
            'rt'                  => 'RT',
            'rw'                  => 'RW',
            'ktp_address'          => 'alamat pada KTP',
            'domicile_address'     => 'alamat domisili',
            'fk_kelurahan'      => 'kelurahan',
            'fk_kecamatan'      => 'kecamatan',
            'fk_kabupaten_kota' => 'kabupaten/kota',
            'fk_provinsi'       => 'provinsi',
            'fk_agama'          => 'agama',
            'fk_pekerjaan'      => 'pekerjaan',
            'marital_status'   => 'status perkawinan',
            'phone'             => 'nomor telepon',
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

            'gender.enum' => 'Jenis kelamin tidak valid.',

            'rt.max' => 'RT maksimal 3 karakter.',
            'rw.max' => 'RW maksimal 3 karakter.',
            'phone.max' => 'Nomor telepon maksimal 20 karakter.',

     
            'fk_tmp_lahir.exists'      => 'Tempat lahir tidak valid.',
            'fk_provinsi.exists'       => 'Provinsi tidak valid.',
            'fk_kabupaten_kota.exists' => 'Kabupaten/kota tidak valid atau tidak sesuai dengan provinsi yang dipilih.',
            'fk_kecamatan.exists'      => 'Kecamatan tidak valid atau tidak sesuai dengan kabupaten/kota yang dipilih.',
            'fk_kelurahan.exists'      => 'Kelurahan tidak valid atau tidak sesuai dengan kecamatan yang dipilih.',
            'fk_agama.exists'          => 'Agama tidak valid.',
            'fk_pekerjaan.exists'      => 'Pekerjaan tidak valid.',
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