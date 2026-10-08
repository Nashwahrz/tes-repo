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
            'nik'               => ['nullable', 'string', 'digits:16', Rule::unique('konsumens', 'nik')->ignore($konsumenId)],
            'name'              => ['nullable', 'string', 'max:255'],
            'tmp_lahir'         => ['nullable', 'string', 'max:100'],
            'tgl_lahir'         => ['nullable', 'date'],
            'jenis_kelamin'     => ['nullable', Rule::enum(JenisKelamin::class)],
            'alamat'            => ['nullable', 'string', 'max:255'],
            'rt'                => ['nullable', 'string', 'max:3'],
            'rw'                => ['nullable', 'string', 'max:3'],
            'desa_kelurahan'    => ['nullable', 'string', 'max:100'],
            'kecamatan'         => ['nullable', 'string', 'max:100'],
            'kabupaten_kota'    => ['nullable', 'string', 'max:100'],
            'provinsi'          => ['nullable', 'string', 'max:100'],
            'agama'             => ['nullable', 'string', 'max:50'],
            'status_perkawinan' => ['nullable', 'string', 'max:50'],
            'pekerjaan'         => ['nullable', 'string', 'max:100'],
            'kewarganegaraan'   => ['nullable', 'string', 'max:50'],
            'no_telp'           => ['nullable', 'string', 'max:20'],
            'email'             => ['nullable', 'email', 'max:255'],
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

