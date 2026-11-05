<?php

namespace App\Http\Requests;

class TempKonsumenRequest extends KonsumenRequest
{
    public function authorize(): bool
    {
        return true;
    }
}
