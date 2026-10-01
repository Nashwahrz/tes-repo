<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureManager
{
    public const ROLE_MANAGER = 1;

    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->id_role !== self::ROLE_MANAGER) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses untuk mengelola akun.',
            ], 403);
        }

        return $next($request);
    }
}
