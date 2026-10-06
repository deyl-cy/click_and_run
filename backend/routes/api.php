<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\AnalysisController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ReportExportController;
use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\AdminActivityLogController;
use App\Http\Controllers\AdminSettingController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\Api\ReportGroupController;

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

Route::prefix('auth')->group(function () {

    Route::post(
        '/login',
        [AuthController::class, 'login']
    );

    Route::middleware('auth:sanctum')->group(function () {

        Route::get(
            '/user',
            [AuthController::class, 'user']
        );

        Route::post(
            '/logout',
            [AuthController::class, 'logout']
        );
    });
});


/*
|--------------------------------------------------------------------------
| Authenticated Routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Authentication
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/auth/user',
        [AuthController::class, 'user']
    );

    Route::post(
        '/auth/logout',
        [AuthController::class, 'logout']
    );


    /*
    |--------------------------------------------------------------------------
    | Settings (read only, all signed-in users)
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/settings',
        [SettingController::class, 'show']
    );


    /*
    |--------------------------------------------------------------------------
    | Dashboard
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/dashboard',
        [DashboardController::class, 'index']
    );


    /*
    |--------------------------------------------------------------------------
    | Analysis
    |--------------------------------------------------------------------------
    */

    Route::post(
        '/reports/analyze',
        [AnalysisController::class, 'analyze']
    );

    Route::post(
        '/reports',
        [AnalysisController::class, 'save']
    );


    /*
    |--------------------------------------------------------------------------
    | Reports
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/reports',
        [ReportController::class, 'index']
    );

    Route::get(
        '/reports/{report}',
        [ReportController::class, 'show']
    );

    Route::put(
        '/reports/{report}',
        [ReportController::class, 'update']
    );

    Route::delete(
        '/reports/{report}',
        [ReportController::class, 'destroy']
    );


    /*
    |--------------------------------------------------------------------------
    | Report Exports
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/reports/{report}/export/pdf',
        [ReportExportController::class, 'pdf']
    );

    Route::get(
        '/reports/{report}/export/excel',
        [ReportExportController::class, 'excel']
    );

    /*
    |--------------------------------------------------------------------------
    | Report Groups Exports
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/report-groups',
        [ReportGroupController::class, 'index']
    );

    Route::get(
        '/report-groups/export/pdf',
        [ReportGroupController::class, 'pdf']
    );
    Route::get(
        '/report-groups/export/excel',
        [ReportGroupController::class, 'excel']
    );


    /*
    |--------------------------------------------------------------------------
    | Admin User Management
    |--------------------------------------------------------------------------
    */

    Route::middleware('admin')
        ->prefix('admin')
        ->group(function () {

            Route::get(
                '/users',
                [AdminUserController::class, 'index']
            );

            Route::post(
                '/users',
                [AdminUserController::class, 'store']
            );

            Route::get(
                '/users/{user}',
                [AdminUserController::class, 'show']
            );

            Route::put(
                '/users/{user}',
                [AdminUserController::class, 'update']
            );

            Route::patch(
                '/users/{user}/status',
                [AdminUserController::class, 'updateStatus']
            );

            Route::patch(
                '/users/{user}/role',
                [AdminUserController::class, 'updateRole']
            );

            Route::get(
                '/activity-logs',
                [AdminActivityLogController::class, 'index']
            );

            Route::get(
                '/settings',
                [AdminSettingController::class, 'index']
            );

            Route::put(
                '/settings',
                [AdminSettingController::class, 'update']
            );

            Route::post(
                '/settings/reset',
                [AdminSettingController::class, 'reset']
            );
        });
});