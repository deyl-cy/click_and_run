<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{
    /**
     * Minutes a token stays valid without any activity.
     * Keep this a little higher than the idle limit in
     * frontend/src/components/SessionTimeout.jsx.
     */
    private const SESSION_MINUTES = 20;

    /**
     * Login
     */
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $credentials['username'])
            ->orWhere('name', $credentials['username'])
            ->first();

        if (
            !$user ||
            !Hash::check($credentials['password'], $user->password)
        ) {
            return response()->json([
                'message' => 'Invalid username or password.',
            ], 401);
        }

        // Correct password, but the account was deactivated by an admin.
        if (!$user->is_active) {
            return response()->json([
                'code' => 'account_deactivated',
                'message' =>
                    'Your account has been deactivated. ' .
                    'Please contact your administrator.',
            ], 403);
        }

        // Remove previous tokens for this user.
        $user->tokens()->delete();

        $token = $user->createToken(
            'click-and-run',
            ['*'],
            now()->addMinutes(self::SESSION_MINUTES)
        )->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $this->userResponse($user),
        ]);
    }

    /**
     * Current authenticated user.
     * Also used as the "keep alive" call: every request
     * pushes the token expiry forward.
     */
    public function user(Request $request): JsonResponse
    {
        $this->extendSession($request);

        return response()->json([
            'user' => $this->userResponse($request->user()),
        ]);
    }

    /**
     * Logout
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()
            ->currentAccessToken()
            ?->delete();

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    private function extendSession(Request $request): void
    {
        $token = $request->user()->currentAccessToken();

        if ($token instanceof PersonalAccessToken) {
            $token->forceFill([
                'expires_at' => now()->addMinutes(self::SESSION_MINUTES),
            ])->save();
        }
    }

    private function userResponse(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'isActive' => $user->is_active,
        ];
    }
}