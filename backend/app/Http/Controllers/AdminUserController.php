<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Hash;

class AdminUserController extends Controller
{
    /**
     * List all users.
     */
    public function index(): JsonResponse
    {
        $users = User::query()
            ->select([
                'id',
                'name',
                'email',
                'role',
                'is_active',
                'created_at',
            ])
            ->latest()
            ->paginate(20);

        return response()->json($users);
    }

    /**
     * Create a new user.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'email' => [
                'required',
                'email',
                'max:255',
                'unique:users,email',
            ],

            'password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
            ],

            'is_active' => [
                'sometimes',
                'boolean',
            ],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make(
                $validated['password']
            ),
            'role' => 'analyst', // new users are always analysts
            'is_active' =>
                $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'message' => 'User created successfully.',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'is_active' => $user->is_active,
                'created_at' => $user->created_at,
            ],
        ], 201);
    }

    /**
     * Show a single user.
     */
    public function show(User $user): JsonResponse
    {
        return response()->json([
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'is_active' => $user->is_active,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
            ],
        ]);
    }

    /**
     * Update user information.
     */
    public function update(
        Request $request,
        User $user
    ): JsonResponse {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')
                    ->ignore($user->id),
            ],

            'is_active' => [
                'sometimes',
                'boolean',
            ],

            'password' => [
                'nullable',
                'string',
                'min:8',
                'confirmed',
            ],
        ]);

        /*
        |--------------------------------------------------------------------------
        | Prevent Admin From Deactivating Themselves
        |--------------------------------------------------------------------------
        */

        if (
            $user->id === $request->user()->id &&
            array_key_exists(
                'is_active',
                $validated
            ) &&
            !$validated['is_active']
        ) {
            return response()->json([
                'message' =>
                    'You cannot deactivate your own account.',
            ], 422);
        }

        $user->name =
            $validated['name'];

        $user->email =
            $validated['email'];

        // Role is fixed: it is never changed from here.

        if (
            array_key_exists(
                'is_active',
                $validated
            )
        ) {
            $user->is_active =
                $validated['is_active'];
        }

        if (
            !empty($validated['password'])
        ) {
            $user->password =
                Hash::make(
                    $validated['password']
                );
        }

        $user->save();

        return response()->json([
            'message' =>
                'User updated successfully.',

            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'is_active' => $user->is_active,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
            ],
        ]);
    }

    /**
     * Activate or deactivate a user.
     */
    public function updateStatus(
        Request $request,
        User $user
    ): JsonResponse {
        $validated = $request->validate([
            'is_active' => [
                'required',
                'boolean',
            ],
        ]);

        /*
        |--------------------------------------------------------------------------
        | Prevent Self-Deactivation
        |--------------------------------------------------------------------------
        */

        if (
            $user->id === $request->user()->id &&
            !$validated['is_active']
        ) {
            return response()->json([
                'message' =>
                    'You cannot deactivate your own account.',
            ], 422);
        }

        $user->is_active =
            $validated['is_active'];

        $user->save();

        return response()->json([
            'message' =>
                $user->is_active
                    ? 'User activated successfully.'
                    : 'User deactivated successfully.',

            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'is_active' => $user->is_active,
            ],
        ]);
    }

    /**
     * Roles are fixed and cannot be changed.
     */
    public function updateRole(
        Request $request,
        User $user
    ): JsonResponse {
        return response()->json([
            'message' => 'User roles are fixed and cannot be changed.',
        ], 403);
    }
}