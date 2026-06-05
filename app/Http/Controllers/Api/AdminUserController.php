<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AdminUserController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(AdminUser::select('id', 'name', 'email', 'role', 'created_at')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:admin_users,email',
            'password' => 'required|string|min:8',
            'role'     => 'required|in:superadmin,admin',
        ]);

        $user = AdminUser::create($validated);

        return response()->json([
            'id'    => $user->id,
            'name'  => $user->name,
            'email' => $user->email,
            'role'  => $user->role,
        ], 201);
    }

    public function destroy(int $id): JsonResponse
    {
        if ($id === Auth::guard('admin')->id()) {
            return response()->json(['message' => 'Cannot delete your own account'], 422);
        }

        AdminUser::findOrFail($id)->delete();

        return response()->json(['success' => true]);
    }
}
