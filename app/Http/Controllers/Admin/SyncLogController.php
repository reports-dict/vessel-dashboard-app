<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SyncLog;
use Inertia\Inertia;
use Inertia\Response;

class SyncLogController extends Controller
{
    public function index(): Response
    {
        $logs = SyncLog::orderByDesc('ran_at')->paginate(20);

        return Inertia::render('Admin/SyncLogs', [
            'logs' => $logs,
        ]);
    }
}
