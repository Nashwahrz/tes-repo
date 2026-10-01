<?php

namespace App\Http\Controllers;

use App\Enums\StatusUser;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserManagementController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'status' => ['nullable', Rule::enum(StatusUser::class)],
        ]);

        $users = User::with('role:id,name')
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->orderByRaw("CASE status WHEN 'pending' THEN 0 ELSE 1 END")
            ->orderBy('id')
            ->get()
            ->map(fn (User $u) => [
                'id'     => $u->id,
                'name'   => $u->name,
                'email'  => $u->email,
                'role'   => $u->role?->name,
                'status' => $u->status->value,
                'label'  => $u->status->label(),
            ]);

        return response()->json(['data' => $users]);
    }

    public function updateStatus(Request $request, User $user)
    {
        $data = $request->validate([
            'status' => ['required', Rule::enum(StatusUser::class)],
        ]);

        if ($user->id === $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak dapat mengubah status akun sendiri.',
            ], 422);
        }

        $user->update(['status' => $data['status']]);

        // Akun yang dinonaktifkan tidak boleh tetap memegang token lama
        if ($user->status !== StatusUser::Aktif) {
            $user->tokens()->delete();
        }

        return response()->json([
            'message' => 'Status akun berhasil diperbarui.',
            'data'    => [
                'id'     => $user->id,
                'status' => $user->status->value,
                'label'  => $user->status->label(),
            ],
        ]);
    }
}
