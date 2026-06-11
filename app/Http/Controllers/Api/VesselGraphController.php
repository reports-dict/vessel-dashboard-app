<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class VesselGraphController extends Controller
{
    public function data(string $vesselId): JsonResponse
    {
        try {
            $rows = DB::connection('mysql_navis')
                ->table('query1')
                ->where('vessel_id', $vesselId)
                ->orderBy('id', 'desc')
                ->limit(24)
                ->get(['time_range', 'total_moves', 'vessel_name']);

            // Reverse so chart reads oldest → newest left to right
            return response()->json($rows->reverse()->values());
        } catch (\Exception $e) {
            return response()->json([]);
        }
    }
}
