<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\VesselPlanOverride;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VesselPlanOverrideController extends Controller
{
    private array $overrideFields = [
        'total_planned_discharge',
        'discharge_plan_fcl_20ft',
        'discharge_plan_fcl_40ft',
        'discharge_plan_mty_20ft',
        'discharge_plan_mty_40ft',
        'total_planned_loading_wi',
        'load_plan_fcl_20ft',
        'load_plan_fcl_40ft',
        'load_plan_empty_20ft',
        'load_plan_empty_40ft',
    ];

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'vessel_id' => 'required|string',
            ...(array_fill_keys($this->overrideFields, 'nullable|integer|min:0')),
        ]);

        VesselPlanOverride::updateOrCreate(
            ['vessel_id' => $validated['vessel_id']],
            $validated
        );

        return response()->json(['success' => true]);
    }

    public function destroy(string $vesselId): JsonResponse
    {
        VesselPlanOverride::where('vessel_id', $vesselId)->delete();

        return response()->json(['success' => true]);
    }
}
