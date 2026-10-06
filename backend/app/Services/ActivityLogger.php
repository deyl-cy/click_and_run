<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Throwable;

class ActivityLogger
{
    /**
     * Action keys => label shown in the Activity Log page.
     */
    public const ACTIONS = [
        'auth.login' => 'Signed in',
        'auth.login_failed' => 'Failed sign-in',
        'auth.logout' => 'Signed out',
        'report.created' => 'Report created',
        'report.updated' => 'Report edited',
        'report.deleted' => 'Report deleted',
        'user.created' => 'User created',
        'user.updated' => 'User updated',
        'user.status' => 'User status changed',
        'settings.updated' => 'Settings updated',
    ];

    /**
     * Record an activity. Never throws: logging must not break the app.
     */
    public static function log(
        string $action,
        string $description,
        ?User $user = null,
        ?Model $subject = null,
        ?string $userName = null
    ): void {
        try {
            ActivityLog::create([
                'user_id' => $user?->id,
                'user_name' => $user?->name ?? $userName,
                'action' => $action,
                'description' => $description,
                'subject_type' => $subject
                    ? class_basename($subject)
                    : null,
                'subject_id' => $subject?->getKey(),
                'ip_address' => request()?->ip(),
                'created_at' => now(),
            ]);
        } catch (Throwable $exception) {
            report($exception);
        }
    }
}
