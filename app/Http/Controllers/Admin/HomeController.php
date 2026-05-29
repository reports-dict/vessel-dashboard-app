<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SyncLog;
use App\Models\VesselVisit;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(): Response
    {
        $totalVisits = VesselVisit::count();
        $lastSync    = SyncLog::latest('ran_at')->first();

        $now  = now();
        $week = $now->copy()->startOfWeek();

        $successCount = SyncLog::where('status', 'success')
            ->whereBetween('ran_at', [$week, $now])
            ->count();

        $failedCount = SyncLog::where('status', 'failed')
            ->whereBetween('ran_at', [$week, $now])
            ->count();

        return Inertia::render('Admin/Home', [
            'stats' => [
                'total_visits'   => $totalVisits,
                'last_sync'      => $lastSync?->ran_at?->toIso8601String(),
                'last_sync_status' => $lastSync?->status,
                'success_this_week' => $successCount,
                'failed_this_week'  => $failedCount,
            ],
        ]);
    }
}
