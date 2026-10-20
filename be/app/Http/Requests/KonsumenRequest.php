<?php

namespace App\Http\Requests;

use App\Enums\JenisKelamin;
use App\Models\Agama;
use App\Models\KabupatenKota;
use App\Models\Kecamatan;
use App\Models\Kelurahan;
use App\Models\Pekerjaan;
use App\Models\Provinsi;
use App\Rules\UserHasRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class KonsumenRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */

    // public function authorize(): bool
    // {
    //     return $this->user()?->role()->where('name', 'ME')->exists() ?? false;
    // }

    // protected function prepareForValidation(): void
    // {
    //     $this->merge([
    //         'id_me' => $this->user()?->id,
    //     ]);
    // }
    public function rules(): array
    {
        $isUpdate = $this->isMethod('put') || $this->isMethod('patch');
        $konsumenId = $this->route('id') ?? $this->route('konsumen');

        return [
            // 'id_me'             => ['required', new UserHasRole('ME')],
            'id_me'             => ['required','exists:users,id'],
            'foto_ktp'          => [$isUpdate ? 'nullable' : 'required', 'image', 'mimes:jpg,jpeg,png', 'max:2048'],
            'nik'               => ['required', 'string', 'digits:16', Rule::unique('konsumens', 'nik')->ignore($konsumenId)],
            'name'              => ['required', 'string', 'max:255'],
            'id_tmp_lahir'      => ['required','integer',Rule::exists(KabupatenKota::class, 'id')],
            'tgl_lahir'         => ['required', 'date'],
            'jenis_kelamin'     => ['required', Rule::enum(JenisKelamin::class)],
            'alamat'            => ['required', 'string', 'max:255'],
            'latitude'          => ['required', 'numeric', 'between:-90,90'],
            'longitude'         => ['required', 'numeric', 'between:-180,180'],
            'rt'                => ['required', 'string', 'max:3'],
            'rw'                => ['required', 'string', 'max:3'],
            'id_kelurahan'      => ['required', 'integer',Rule::exists(Kelurahan::class, 'id')->where('id_kecamatan', $this->input('id_kecamatan'))],
            'id_kecamatan'      => ['required', 'integer',Rule::exists(Kecamatan::class, 'id')->where('id_kabupaten_kota', $this->input('id_kabupaten_kota'))],
            'id_kabupaten_kota' => ['required', 'integer',Rule::exists(KabupatenKota::class, 'id')->where('id_provinsi', $this->input('id_provinsi'))],
            'id_provinsi'       => ['required', 'integer',Rule::exists(Provinsi::class, 'id')],
            'id_agama'          => ['required', 'integer',Rule::exists(Agama::class, 'id')],
            'status_perkawinan' => ['required', 'string', 'max:50'],
            'id_pekerjaan'      => ['required', 'integer',Rule::exists(Pekerjaan::class, 'id')],
            'kewarganegaraan'   => ['required', 'string', 'max:50'],
            'no_telp'           => ['required', 'string', 'max:20'],
            'email'             => ['required', 'email', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'required' => ':attribute wajib diisi.',
            'id_me.required'    => 'ID ME wajib diisi.',
            'id_me.exists'      => 'ID ME tidak terdaftar.',
            'id_me.role'        => 'Anda tidak memiliki akses untuk melakukan ini.',
            'foto_ktp.required' => 'Foto KTP wajib diunggah.',
            'foto_ktp.image'    => 'File harus berupa gambar.',
            'foto_ktp.mimes'    => 'Format file harus JPG, JPEG, atau PNG.',
            'foto_ktp.max'      => 'Ukuran file maksimal 2MB.',
            'nik.digits'        => 'NIK harus terdiri dari 16 digit angka.',
            'nik.unique'        => 'NIK sudah terdaftar.',
            'nik.regex'        => 'NIK tidak boleh mengandung huruf atau simbol.',
            'tgl_lahir.date'    => 'Format tanggal lahir tidak valid.',
            'email.email'       => 'Format email tidak valid.',
            'email.unique'        => 'Email sudah terdaftar.',
            'email.required'    => 'Email wajib diisi.',
            'no_telp.max'         => 'Nomor telepon maksimal 20 digit.',
            'id_tmp_lahir.exists' => 'Tempat lahir tidak terdaftar.',
            'id_kabupaten_kota.exists' => 'Kabupaten/kota tidak sesuai dengan provinsi yang dipilih.',
            'id_kecamatan.exists'      => 'Kecamatan tidak sesuai dengan kabupaten/kota yang dipilih.',
            'id_kelurahan.exists'      => 'Kelurahan tidak sesuai dengan kecamatan yang dipilih.',
            'id_provinsi.exists' => 'Provinsi tidak terdaftar.',
            'latitude.required' => 'Latitude wajib diisi.',
            'latitude.decimal'  => 'Latitude harus berupa angka desimal.',
            'longitude.required' => 'Longitude wajib diisi.',
            'longitude.decimal'  => 'Longitude harus berupa angka desimal.',
            'no_telp.required'    => 'Nomor telepon wajib diisi.',
            'rt.max'              => 'RT maksimal 3 digit.',
            'rw.max'              => 'RW maksimal 3 digit.',
            'agama.max'           => 'Agama maksimal 50 karakter.',
            'status_perkawinan.max' => 'Status perkawinan maksimal 50 karakter.',
            'pekerjaan.max'       => 'Pekerjaan maksimal 100 karakter.',
            'kewarganegaraan.max' => 'Kewarganegaraan maksimal 50 karakter.',
            
        ];
        
    }
}

