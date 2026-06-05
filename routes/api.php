<?php

use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\AdminVesselOverrideController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\VesselGraphController;
use Illuminate\Support\Facades\Route;

// Public dashboard endpoints
Route::get('/dashboard-data', [DashboardController::class, 'data']);
Route::get('/vessel-graph/{vesselId}', [VesselGraphController::class, 'data']);

// Auth (public)
Route::post('/auth/login', [AuthController::class, 'login']);

// Protected by JWT admin guard
Route::middleware('auth:admin')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // Both admin + superadmin: override planned vessel figures
    Route::post('/admin/vessel-plan-override', [AdminVesselOverrideController::class, 'store']);
    Route::delete('/admin/vessel-plan-override/{obIbId}', [AdminVesselOverrideController::class, 'destroy']);

    // Superadmin only: user management
    Route::middleware('role:superadmin')->group(function () {
        Route::get('/admin/users', [AdminUserController::class, 'index']);
        Route::post('/admin/users', [AdminUserController::class, 'store']);
        Route::delete('/admin/users/{id}', [AdminUserController::class, 'destroy']);
    });
});
