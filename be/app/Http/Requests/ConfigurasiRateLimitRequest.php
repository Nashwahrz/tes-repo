<?php

namespace App\Http\Requests;

use App\Models\ConfigurasiRateLimit;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ConfigurasiRateLimitRequest extends FormRequest
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
        return [
            'name'=> ['required','string',Rule::unique(ConfigurasiRateLimit::class, 'name')],
            'request_per_minutes'=> ['required','integer', 'min:1'],
            'minutes'=> ['required','integer', 'min:1'],
            'is_active'=> ['required','boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Nama wajib diisi.',
            'name.string' => 'Nama harus berupa string.',
            'name.unique' => 'Nama sudah ada.',
            'request_per_minutes.required' => 'Request per minutes wajib diisi.',
            'request_per_minutes.integer' => 'Request per minutes harus berupa integer.',
            'request_per_minutes.min' => 'Request per minutes minimal 1.',
            'minutes.required' => 'Minutes wajib diisi.',
            'minutes.integer' => 'Minutes harus berupa integer.',
            'minutes.min' => 'Minutes minimal 1.',
            'is_active.required' => 'Is active wajib diisi.',
            'is_active.boolean' => 'Is active harus berupa boolean.',
        ];
    }
}
