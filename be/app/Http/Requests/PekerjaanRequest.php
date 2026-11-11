<?php

namespace App\Http\Requests;

use App\Enums\SectorJob;
use App\Enums\TypeHeaderPekerjaan;
use App\Http\Responses\PekerjaanResponse;
use App\Models\Pekerjaan;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;


class PekerjaanRequest extends FormRequest
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
    protected function prepareForValidation(): void
    {
      
        if ($this->input('type_header') === TypeHeaderPekerjaan::Header->value && $this->filled('pekerjaan_code')) {
            $this->merge([
                'id_parent' => (int) $this->input('pekerjaan_code'),
            ]);
        }
    }

    public function rules(): array
    {
        $pekerjaanId = $this->route('pekerjaan') ?? $this->route('id');

        $parentRule = [
            'nullable',
            'required_if:type_header,' . TypeHeaderPekerjaan::Detail->value,
            Rule::when(
                fn ($input) => ($input['type_header'] ?? null) === TypeHeaderPekerjaan::Detail->value,
                [Rule::exists(Pekerjaan::class, 'pekerjaan_code')->where(function ($query) {
                    $query->where('type_header', TypeHeaderPekerjaan::Header->value);
                })],
                ['nullable']
            ),
        ];

        if ($this->isMethod('put') || $this->isMethod('patch')) {
            return [
                'pekerjaan_name' => [
                    'required',
                    'string',
                    'max:255',
                    Rule::unique(Pekerjaan::class, 'pekerjaan_name')->ignore($pekerjaanId),
                ],
                'sequence' => [
                    'required',
                    'integer',
                ],
                'type_header' => [
                    'required',
                    Rule::enum(TypeHeaderPekerjaan::class),
                ],
                'sector_job' => [
                    'required',
                    Rule::enum(SectorJob::class),
                ],
                'id_parent' => $parentRule,
                'status' => [
                    'nullable',
                    'boolean',
                ],
            ];
        }

        return [
            'pekerjaan_code' => [
                'required',
                'string',
                'between:1,3',
                Rule::unique(Pekerjaan::class, 'pekerjaan_code'),
            ],
            'pekerjaan_name' => [
                'required',
                'string',
                'max:255',
                Rule::unique(Pekerjaan::class, 'pekerjaan_name'),
            ],
            'sequence' => [
                'required',
                'integer',
            ],
            'type_header' => [
                'required',
                Rule::enum(TypeHeaderPekerjaan::class),
            ],
            'sector_job' => [
                'required',
                Rule::enum(SectorJob::class),
            ],
            'id_parent' => $parentRule,
            'status' => [
                'nullable',
                'boolean',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'pekerjaan_code.required' => 'Kode pekerjaan wajib diisi.',
            'pekerjaan_code.string'   => 'Kode pekerjaan harus berupa teks.',
            'pekerjaan_code.between'  => 'Kode pekerjaan harus terdiri dari 1 sampai 3 karakter.',
            'pekerjaan_code.unique'   => 'Kode pekerjaan sudah terdaftar.',

            'pekerjaan_name.required' => 'Nama pekerjaan wajib diisi.',
            'pekerjaan_name.string'   => 'Nama pekerjaan harus berupa teks.',
            'pekerjaan_name.max'      => 'Nama pekerjaan tidak boleh lebih dari :max karakter.',
            'pekerjaan_name.unique'   => 'Nama pekerjaan sudah terdaftar.',

            'sequence.required' => 'Urutan tampilan wajib diisi.',
            'sequence.integer'  => 'Urutan tampilan harus berupa angka bulat.',

            'type_header.required' => 'Tipe header wajib diisi.',
            'type_header.enum'     => 'Tipe header tidak valid.',

            'sector_job.required' => 'Sektor pekerjaan wajib diisi.',
            'sector_job.enum'     => 'Sektor pekerjaan tidak valid.',

            'id_parent.required' => 'Induk pekerjaan wajib diisi untuk pekerjaan tipe Detail.',
            'id_parent.exists'   => 'Induk pekerjaan tidak ditemukan atau bukan bertipe Header.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            app(PekerjaanResponse::class)->validationError($validator->errors()->toArray())
        );
    }
}
