<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckMenuAccess
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string|null  $menuUrl
     */
    public function handle(Request $request, Closure $next, ?string $menuUrl = null): Response
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

        $targetUrl = $menuUrl ?: $request->segment(2);

        $hasAccess = $user->role->menus()
            ->where('menus.url', $targetUrl)
            ->where('menus.status', true)
            ->exists();

        if (!$hasAccess) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Anda tidak memiliki izin akses menu ini.',
            ], 403);
        }

        return $next($request);
    }
}
