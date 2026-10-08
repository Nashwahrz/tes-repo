<?php

namespace App\Http\Requests;

use App\Enums\JenisKelamin;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class KonsumenRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $isUpdate = $this->isMethod('put') || $this->isMethod('patch');
        $konsumenId = $this->route('id') ?? $this->route('konsumen');

        return [
            'id_me'             => ['required', 'exists:users,id'],
            'foto_ktp'          => [$isUpdate ? 'nullable' : 'required', 'image', 'mimes:jpg,jpeg,png', 'max:2048'],
            'nik'               => ['required', 'string', 'digits:16', Rule::unique('konsumens', 'nik')->ignore($konsumenId)],
            'name'              => ['required', 'string', 'max:255'],
            'tmp_lahir'         => ['required', 'string', 'max:100'],
            'tgl_lahir'         => ['required', 'date'],
            'jenis_kelamin'     => ['required', Rule::enum(JenisKelamin::class)],
            'alamat'            => ['required', 'string', 'max:255'],
            'latitude'          => ['required','decimal:7'],
            'longitude'         => ['required','decimal:7'],
            'rt'                => ['required', 'string', 'max:3'],
            'rw'                => ['required', 'string', 'max:3'],
            'desa_kelurahan'    => ['required', 'string', 'max:100'],
            'kecamatan'         => ['required', 'string', 'max:100'],
            'kabupaten_kota'    => ['required', 'string', 'max:100'],
            'provinsi'          => ['required', 'string', 'max:100'],
            'agama'             => ['required', 'string', 'max:50'],
            'status_perkawinan' => ['required', 'string', 'max:50'],
            'pekerjaan'         => ['required', 'string', 'max:100'],
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
            'foto_ktp.required' => 'Foto KTP wajib diunggah.',
            'foto_ktp.image'    => 'File harus berupa gambar.',
            'foto_ktp.mimes'    => 'Format file harus JPG, JPEG, atau PNG.',
            'foto_ktp.max'      => 'Ukuran file maksimal 2MB.',
            'nik.digits'        => 'NIK harus terdiri dari 16 digit angka.',
            'nik.unique'        => 'NIK sudah terdaftar.',
            'nik.regex'        => 'NIK tidak boleh mengandung huruf atau simbol.',
            'tgl_lahir.date'    => 'Format tanggal lahir tidak valid.',
            'email.email'       => 'Format email tidak valid.',
        ];
    }
}

