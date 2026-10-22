<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EmailSmtpRequest extends FormRequest
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
            'mail_mailer' => 'required|in:smtp,sendmail,mail',
            'mail_host' => 'required|string|max:255',
            'mail_port' => 'required|integer|min:1|max:65535',
            'mail_username' => 'nullable|string|max:255',
            'mail_password' => 'nullable|string|max:255',
            'mail_encryption' => 'required|in:null,tls,ssl',
            'mail_from_address' => 'required|email|max:255',
            'mail_from_name' => 'required|string|max:255',
            'is_active' => 'required|boolean',
        ];
    }

    public function messages(): array
{
    return [
        'mail_mailer.required' => 'Mailer wajib diisi.',
        'mail_mailer.in' => 'Mailer harus salah satu dari: smtp, sendmail, mail.',
        
        'mail_host.required' => 'Host wajib diisi.',
        'mail_host.string' => 'Host harus berupa teks.',
        'mail_host.max' => 'Host maksimal 255 karakter.',
        
        'mail_port.required' => 'Port wajib diisi.',
        'mail_port.integer' => 'Port harus berupa angka.',
        'mail_port.min' => 'Port minimal 1.',
        'mail_port.max' => 'Port maksimal 65535.',
        
        'mail_username.string' => 'Username harus berupa teks.',
        'mail_username.max' => 'Username maksimal 255 karakter.',
        
        'mail_password.string' => 'Password harus berupa teks.',
        'mail_password.max' => 'Password maksimal 255 karakter.',
        
        'mail_encryption.required' => 'Enkripsi wajib diisi.',
        'mail_encryption.in' => 'Enkripsi harus salah satu dari: null, tls, ssl.',
        
        'mail_from_address.required' => 'Alamat email pengirim wajib diisi.',
        'mail_from_address.email' => 'Format email tidak valid.',
        'mail_from_address.max' => 'Alamat email pengirim maksimal 255 karakter.',
        
        'mail_from_name.required' => 'Nama pengirim wajib diisi.',
        'mail_from_name.string' => 'Nama pengirim harus berupa teks.',
        'mail_from_name.max' => 'Nama pengirim maksimal 255 karakter.',
        
        'is_active.required' => 'Status aktif wajib diisi.',
        'is_active.boolean' => 'Status aktif harus true atau false.',
    ];
}
}
