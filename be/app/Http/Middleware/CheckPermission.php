<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$permissions
     */
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if (!$user->id_role || !$user->role) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Pengguna belum memiliki role yang valid.',
            ], 403);
        }

        $hasPermission = $user->role->permissions()
            ->whereIn('permissions.nama_permission', $permissions)
            ->exists();

        if (!$hasPermission) {
            return response()->json([
                'success' => false,
                'message' => "Akses ditolak. Anda tidak memiliki izin yang diperlukan.",
            ], 403);
        }

        return $next($request);
    }
}
