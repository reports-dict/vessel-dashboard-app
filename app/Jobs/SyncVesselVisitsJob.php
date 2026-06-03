<?php

namespace App\Jobs;

use App\Models\SyncLog;
use App\Models\VesselVisit;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SyncVesselVisitsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        $startMs = (int) round(microtime(true) * 1000);

        try {
            $rows = DB::connection('sqlsrv_remote')->select($this->query());

            $rowsFetched  = count($rows);
            $rowsUpserted = 0;

            foreach ($rows as $row) {
                VesselVisit::updateOrCreate(
                    ['ob_ib_id' => $row->ob_ib_id],
                    [
                        'vessel_name'               => $row->vessel_name,
                        'service'                   => $row->service,
                        'vessel_id'                 => $row->vessel_id,
                        'phase'                     => $row->phase,
                        'line_op'                   => $row->line_op,
                        'total_planned_loading_wi'  => (int) $row->total_planned_loading_wi,
                        'load_plan_fcl_20ft'        => (int) $row->load_plan_fcl_20ft,
                        'load_plan_fcl_40ft'        => (int) $row->load_plan_fcl_40ft,
                        'load_plan_empty_20ft'      => (int) $row->load_plan_empty_20ft,
                        'load_plan_empty_40ft'      => (int) $row->load_plan_empty_40ft,
                        'total_loaded_count'        => (int) $row->total_loaded_count,
                        'loaded_fcl_20ft'           => (int) $row->loaded_fcl_20ft,
                        'loaded_fcl_40ft'           => (int) $row->loaded_fcl_40ft,
                        'loaded_empty_20ft'         => (int) $row->loaded_empty_20ft,
                        'loaded_empty_40ft'         => (int) $row->loaded_empty_40ft,
                        'total_planned_discharge'   => (int) $row->total_planned_discharge,
                        'discharge_plan_fcl_20ft'   => (int) $row->discharge_plan_fcl_20ft,
                        'discharge_plan_fcl_40ft'   => (int) $row->discharge_plan_fcl_40ft,
                        'discharge_plan_mty_20ft'   => (int) $row->discharge_plan_mty_20ft,
                        'discharge_plan_mty_40ft'   => (int) $row->discharge_plan_mty_40ft,
                        'total_discharged_count'    => (int) $row->total_discharged_count,
                        'discharged_fcl_20ft'       => (int) $row->discharged_fcl_20ft,
                        'discharged_fcl_40ft'       => (int) $row->discharged_fcl_40ft,
                        'discharged_empty_20ft'     => (int) $row->discharged_empty_20ft,
                        'discharged_empty_40ft'     => (int) $row->discharged_empty_40ft,
                        'synced_at'                 => now(),
                    ]
                );
                $rowsUpserted++;
            }

            SyncLog::create([
                'ran_at'        => now(),
                'rows_fetched'  => $rowsFetched,
                'rows_upserted' => $rowsUpserted,
                'status'        => 'success',
                'error_message' => null,
                'duration_ms'   => (int) round(microtime(true) * 1000) - $startMs,
            ]);
        } catch (\Throwable $e) {
            Log::error('SyncVesselVisitsJob failed: ' . $e->getMessage(), ['exception' => $e]);

            SyncLog::create([
                'ran_at'        => now(),
                'rows_fetched'  => 0,
                'rows_upserted' => 0,
                'status'        => 'failed',
                'error_message' => $e->getMessage(),
                'duration_ms'   => (int) round(microtime(true) * 1000) - $startMs,
            ]);

            throw $e;
        }
    }

    private function query(): string
    {
        return <<<'SQL'
SELECT TOP 10
    argo_cv.gkey as ob_ib_id,
    argo_cv.ata as actual_time_of_arrival,
    argo_cv.atd as actual_time_of_departure,
    vvsl.name AS vessel_name,
    ref_c_service.id as service,
    argo_cv.id as vessel_id,
    argo_cv.phase,
    ref_biz.id as line_op,
    (SELECT count(*)
    FROM [sparcsn4].[dbo].[inv_wi]
    WHERE pos_loctype = 'VESSEL'
    AND pos_loc_gkey = argo_cv.gkey
    AND move_kind = 'LOAD') as total_planned_loading_wi,
    (SELECT count(*)
    FROM [sparcsn4].[dbo].[inv_wi] as wi
    LEFT JOIN [sparcsn4].[dbo].[inv_unit_yrd_visit] AS yrd_visit ON wi.uyv_gkey=yrd_visit.gkey
    LEFT JOIN [sparcsn4].[dbo].[inv_unit_fcy_visit] AS fcy_visit ON yrd_visit.ufv_gkey=fcy_visit.gkey
    LEFT JOIN [sparcsn4].[dbo].[inv_unit] AS unit ON fcy_visit.unit_gkey=unit.gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equipment] as ref_eq ON unit.eq_gkey = ref_eq.gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equip_type] as eq_type ON ref_eq.eqtyp_gkey = eq_type.gkey
    WHERE wi.pos_loctype = 'VESSEL' AND wi.pos_loc_gkey = argo_cv.gkey
    AND wi.move_kind = 'LOAD' AND eq_type.basic_length = 'BASIC20' AND unit.freight_kind = 'FCL') as load_plan_fcl_20ft,
    (SELECT count(*)
    FROM [sparcsn4].[dbo].[inv_wi] as wi
    LEFT JOIN [sparcsn4].[dbo].[inv_unit_yrd_visit] AS yrd_visit ON wi.uyv_gkey=yrd_visit.gkey
    LEFT JOIN [sparcsn4].[dbo].[inv_unit_fcy_visit] AS fcy_visit ON yrd_visit.ufv_gkey=fcy_visit.gkey
    LEFT JOIN [sparcsn4].[dbo].[inv_unit] AS unit ON fcy_visit.unit_gkey=unit.gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equipment] as ref_eq ON unit.eq_gkey = ref_eq.gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equip_type] as eq_type ON ref_eq.eqtyp_gkey = eq_type.gkey
    WHERE wi.pos_loctype = 'VESSEL' AND wi.pos_loc_gkey = argo_cv.gkey
    AND wi.move_kind = 'LOAD' AND eq_type.basic_length = 'BASIC40' AND unit.freight_kind = 'FCL') as load_plan_fcl_40ft,
    (SELECT count(*)
    FROM [sparcsn4].[dbo].[inv_wi] as wi
    LEFT JOIN [sparcsn4].[dbo].[inv_unit_yrd_visit] AS yrd_visit ON wi.uyv_gkey=yrd_visit.gkey
    LEFT JOIN [sparcsn4].[dbo].[inv_unit_fcy_visit] AS fcy_visit ON yrd_visit.ufv_gkey=fcy_visit.gkey
    LEFT JOIN [sparcsn4].[dbo].[inv_unit] AS unit ON fcy_visit.unit_gkey=unit.gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equipment] as ref_eq ON unit.eq_gkey = ref_eq.gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equip_type] as eq_type ON ref_eq.eqtyp_gkey = eq_type.gkey
    WHERE wi.pos_loctype = 'VESSEL' AND wi.pos_loc_gkey = argo_cv.gkey
    AND wi.move_kind = 'LOAD' AND eq_type.basic_length = 'BASIC20' AND unit.freight_kind = 'MTY') as load_plan_empty_20ft,
    (SELECT count(*)
    FROM [sparcsn4].[dbo].[inv_wi] as wi
    LEFT JOIN [sparcsn4].[dbo].[inv_unit_yrd_visit] AS yrd_visit ON wi.uyv_gkey=yrd_visit.gkey
    LEFT JOIN [sparcsn4].[dbo].[inv_unit_fcy_visit] AS fcy_visit ON yrd_visit.ufv_gkey=fcy_visit.gkey
    LEFT JOIN [sparcsn4].[dbo].[inv_unit] AS unit ON fcy_visit.unit_gkey=unit.gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equipment] as ref_eq ON unit.eq_gkey = ref_eq.gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equip_type] as eq_type ON ref_eq.eqtyp_gkey = eq_type.gkey
    WHERE wi.pos_loctype = 'VESSEL' AND wi.pos_loc_gkey = argo_cv.gkey
    AND wi.move_kind = 'LOAD' AND eq_type.basic_length = 'BASIC40' AND unit.freight_kind = 'MTY') as load_plan_empty_40ft,
    (SELECT count(*)
    FROM [sparcsn4].[dbo].[inv_unit] as unit
    INNER JOIN [sparcsn4].[dbo].[inv_unit_fcy_visit] as fcy_visit ON unit.gkey=fcy_visit.unit_gkey
    WHERE fcy_visit.actual_ob_cv = argo_cv.gkey AND unit.id NOT LIKE '%DUMM%' AND unit.id NOT LIKE '%SAMM%'
    AND unit.category IN ('EXPRT','TRSHP') AND fcy_visit.transit_state in ('S60_LOADED','S70_DEPARTED')) as total_loaded_count,
    (SELECT count(*)
    FROM [sparcsn4].[dbo].[inv_unit] as unit
    INNER JOIN [sparcsn4].[dbo].[inv_unit_fcy_visit] as fcy_visit ON unit.gkey=fcy_visit.unit_gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equipment] as ref_eq ON unit.eq_gkey = ref_eq.gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equip_type] as eq_type ON ref_eq.eqtyp_gkey = eq_type.gkey
    WHERE fcy_visit.actual_ob_cv = argo_cv.gkey AND unit.id NOT LIKE '%DUMM%' AND unit.id NOT LIKE '%SAMM%'
    AND unit.category IN ('EXPRT','TRSHP') AND unit.freight_kind = 'FCL'
    AND fcy_visit.transit_state in ('S60_LOADED','S70_DEPARTED') AND eq_type.basic_length = 'BASIC20') as loaded_fcl_20ft,
    (SELECT count(*)
    FROM [sparcsn4].[dbo].[inv_unit] as unit
    INNER JOIN [sparcsn4].[dbo].[inv_unit_fcy_visit] as fcy_visit ON unit.gkey=fcy_visit.unit_gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equipment] as ref_eq ON unit.eq_gkey = ref_eq.gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equip_type] as eq_type ON ref_eq.eqtyp_gkey = eq_type.gkey
    WHERE fcy_visit.actual_ob_cv = argo_cv.gkey AND unit.id NOT LIKE '%DUMM%' AND unit.id NOT LIKE '%SAMM%'
    AND unit.category IN ('EXPRT','TRSHP') AND unit.freight_kind = 'FCL'
    AND fcy_visit.transit_state in ('S60_LOADED','S70_DEPARTED') AND eq_type.basic_length = 'BASIC40') as loaded_fcl_40ft,
    (SELECT count(*)
    FROM [sparcsn4].[dbo].[inv_unit] as unit
    INNER JOIN [sparcsn4].[dbo].[inv_unit_fcy_visit] as fcy_visit ON unit.gkey=fcy_visit.unit_gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equipment] as ref_eq ON unit.eq_gkey = ref_eq.gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equip_type] as eq_type ON ref_eq.eqtyp_gkey = eq_type.gkey
    WHERE fcy_visit.actual_ob_cv = argo_cv.gkey AND unit.id NOT LIKE '%DUMM%' AND unit.id NOT LIKE '%SAMM%'
    AND unit.category IN ('EXPRT','TRSHP') AND unit.freight_kind = 'MTY'
    AND fcy_visit.transit_state in ('S60_LOADED','S70_DEPARTED') AND eq_type.basic_length = 'BASIC20') as loaded_empty_20ft,
    (SELECT count(*)
    FROM [sparcsn4].[dbo].[inv_unit] as unit
    INNER JOIN [sparcsn4].[dbo].[inv_unit_fcy_visit] as fcy_visit ON unit.gkey=fcy_visit.unit_gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equipment] as ref_eq ON unit.eq_gkey = ref_eq.gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equip_type] as eq_type ON ref_eq.eqtyp_gkey = eq_type.gkey
    WHERE fcy_visit.actual_ob_cv = argo_cv.gkey AND unit.id NOT LIKE '%DUMM%' AND unit.id NOT LIKE '%SAMM%'
    AND unit.category IN ('EXPRT','TRSHP') AND unit.freight_kind = 'MTY'
    AND fcy_visit.transit_state in ('S60_LOADED','S70_DEPARTED') AND eq_type.basic_length = 'BASIC40') as loaded_empty_40ft,
    (SELECT count(*)
    FROM [sparcsn4].[dbo].[inv_unit] as unit
    INNER JOIN [sparcsn4].[dbo].[inv_unit_fcy_visit] as fcy_visit ON unit.gkey=fcy_visit.unit_gkey
    WHERE fcy_visit.actual_ib_cv = argo_cv.gkey AND unit.id NOT LIKE '%DUMM%' AND unit.id NOT LIKE '%SAMM%' AND unit.category IN ('IMPRT','TRSHP')) as total_planned_discharge,
    (SELECT count(*)
    FROM [sparcsn4].[dbo].[inv_unit] as unit
    INNER JOIN [sparcsn4].[dbo].[inv_unit_fcy_visit] as fcy_visit ON unit.gkey=fcy_visit.unit_gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equipment] as ref_eq ON unit.eq_gkey = ref_eq.gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equip_type] as eq_type ON ref_eq.eqtyp_gkey = eq_type.gkey
    WHERE fcy_visit.actual_ib_cv = argo_cv.gkey AND unit.id NOT LIKE '%DUMM%' AND unit.id NOT LIKE '%SAMM%'
    AND unit.freight_kind = 'FCL' AND eq_type.basic_length = 'BASIC20' AND unit.category IN ('IMPRT','TRSHP')) as discharge_plan_fcl_20ft,
    (SELECT count(*)
    FROM [sparcsn4].[dbo].[inv_unit] as unit
    INNER JOIN [sparcsn4].[dbo].[inv_unit_fcy_visit] as fcy_visit ON unit.gkey=fcy_visit.unit_gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equipment] as ref_eq ON unit.eq_gkey = ref_eq.gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equip_type] as eq_type ON ref_eq.eqtyp_gkey = eq_type.gkey
    WHERE fcy_visit.actual_ib_cv = argo_cv.gkey AND unit.id NOT LIKE '%DUMM%' AND unit.id NOT LIKE '%SAMM%'
    AND unit.freight_kind = 'FCL' AND eq_type.basic_length = 'BASIC40' AND unit.category IN ('IMPRT','TRSHP')) as discharge_plan_fcl_40ft,
    (SELECT count(*)
    FROM [sparcsn4].[dbo].[inv_unit] as unit
    INNER JOIN [sparcsn4].[dbo].[inv_unit_fcy_visit] as fcy_visit ON unit.gkey=fcy_visit.unit_gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equipment] as ref_eq ON unit.eq_gkey = ref_eq.gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equip_type] as eq_type ON ref_eq.eqtyp_gkey = eq_type.gkey
    WHERE fcy_visit.actual_ib_cv = argo_cv.gkey AND unit.id NOT LIKE '%DUMM%' AND unit.id NOT LIKE '%SAMM%'
    AND unit.freight_kind = 'MTY' AND eq_type.basic_length = 'BASIC20' AND unit.category IN ('IMPRT','TRSHP')) as discharge_plan_mty_20ft,
    (SELECT count(*)
    FROM [sparcsn4].[dbo].[inv_unit] as unit
    INNER JOIN [sparcsn4].[dbo].[inv_unit_fcy_visit] as fcy_visit ON unit.gkey=fcy_visit.unit_gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equipment] as ref_eq ON unit.eq_gkey = ref_eq.gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equip_type] as eq_type ON ref_eq.eqtyp_gkey = eq_type.gkey
    WHERE fcy_visit.actual_ib_cv = argo_cv.gkey AND unit.id NOT LIKE '%DUMM%' AND unit.id NOT LIKE '%SAMM%'
    AND unit.freight_kind = 'MTY' AND eq_type.basic_length = 'BASIC40' AND unit.category IN ('IMPRT','TRSHP')) as discharge_plan_mty_40ft,
    (SELECT count(*)
    FROM [sparcsn4].[dbo].[inv_unit] as unit
    INNER JOIN [sparcsn4].[dbo].[inv_unit_fcy_visit] as fcy_visit ON unit.gkey=fcy_visit.unit_gkey
    WHERE fcy_visit.actual_ib_cv = argo_cv.gkey AND unit.id NOT LIKE '%DUMM%' AND unit.id NOT LIKE '%SAMM%'
    AND unit.category IN ('IMPRT','TRSHP','THRGH') AND unit.category IN ('IMPRT','TRSHP') AND fcy_visit.transit_state NOT IN ('S10_ADVISED','S20_INBOUND','S99_RETIRED')) as total_discharged_count,
    (SELECT count(*)
    FROM [sparcsn4].[dbo].[inv_unit] as unit
    INNER JOIN [sparcsn4].[dbo].[inv_unit_fcy_visit] as fcy_visit ON unit.gkey=fcy_visit.unit_gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equipment] as ref_eq ON unit.eq_gkey = ref_eq.gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equip_type] as eq_type ON ref_eq.eqtyp_gkey = eq_type.gkey
    WHERE fcy_visit.actual_ib_cv = argo_cv.gkey AND unit.id NOT LIKE '%DUMM%' AND unit.id NOT LIKE '%SAMM%'
    AND unit.category IN ('IMPRT','TRSHP','THRGH') AND unit.freight_kind = 'FCL'
    AND fcy_visit.transit_state NOT IN ('S10_ADVISED','S20_INBOUND','S99_RETIRED') AND eq_type.basic_length = 'BASIC20') as discharged_fcl_20ft,
    (SELECT count(*)
    FROM [sparcsn4].[dbo].[inv_unit] as unit
    INNER JOIN [sparcsn4].[dbo].[inv_unit_fcy_visit] as fcy_visit ON unit.gkey=fcy_visit.unit_gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equipment] as ref_eq ON unit.eq_gkey = ref_eq.gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equip_type] as eq_type ON ref_eq.eqtyp_gkey = eq_type.gkey
    WHERE fcy_visit.actual_ib_cv = argo_cv.gkey AND unit.id NOT LIKE '%DUMM%' AND unit.id NOT LIKE '%SAMM%'
    AND unit.category IN ('IMPRT','TRSHP') AND unit.freight_kind = 'FCL'
    AND fcy_visit.transit_state NOT IN ('S10_ADVISED','S20_INBOUND','S99_RETIRED') AND eq_type.basic_length = 'BASIC40') as discharged_fcl_40ft,
    (SELECT count(*)
    FROM [sparcsn4].[dbo].[inv_unit] as unit
    INNER JOIN [sparcsn4].[dbo].[inv_unit_fcy_visit] as fcy_visit ON unit.gkey=fcy_visit.unit_gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equipment] as ref_eq ON unit.eq_gkey = ref_eq.gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equip_type] as eq_type ON ref_eq.eqtyp_gkey = eq_type.gkey
    WHERE fcy_visit.actual_ib_cv = argo_cv.gkey AND unit.id NOT LIKE '%DUMM%' AND unit.id NOT LIKE '%SAMM%'
    AND unit.category IN ('IMPRT','TRSHP','THRGH') AND unit.freight_kind = 'MTY' AND unit.category IN ('IMPRT','TRSHP')
    AND fcy_visit.transit_state NOT IN ('S10_ADVISED','S20_INBOUND','S99_RETIRED') AND eq_type.basic_length = 'BASIC20') as discharged_empty_20ft,
    (SELECT count(*)
    FROM [sparcsn4].[dbo].[inv_unit] as unit
    INNER JOIN [sparcsn4].[dbo].[inv_unit_fcy_visit] as fcy_visit ON unit.gkey=fcy_visit.unit_gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equipment] as ref_eq ON unit.eq_gkey = ref_eq.gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equip_type] as eq_type ON ref_eq.eqtyp_gkey = eq_type.gkey
    WHERE fcy_visit.actual_ib_cv = argo_cv.gkey AND unit.id NOT LIKE '%DUMM%' AND unit.id NOT LIKE '%SAMM%'
    AND unit.category IN ('IMPRT','TRSHP','THRGH') AND unit.freight_kind = 'MTY'
    AND fcy_visit.transit_state NOT IN ('S10_ADVISED','S20_INBOUND','S99_RETIRED') AND eq_type.basic_length = 'BASIC40') as discharged_empty_40ft
FROM [sparcsn4].[dbo].vsl_vessels as vvsl
INNER JOIN [sparcsn4].[dbo].vsl_vessel_visit_details as vvsl_vd ON vvsl.gkey=vvsl_vd.vessel_gkey
INNER JOIN [sparcsn4].[dbo].argo_carrier_visit as argo_cv ON vvsl_vd.vvd_gkey=argo_cv.cvcvd_gkey
INNER JOIN [sparcsn4].[dbo].argo_visit_details as argo_vd ON argo_vd.gkey=argo_cv.cvcvd_gkey
INNER JOIN [sparcsn4].[dbo].ref_carrier_service as ref_c_service ON argo_vd.service=ref_c_service.gkey
INNER JOIN [sparcsn4].[dbo].ref_bizunit_scoped as ref_biz ON ref_biz.gkey=vvsl_vd.bizu_gkey
WHERE argo_cv.phase IN ('40WORKING','30ARRIVED') AND argo_cv.carrier_mode='VESSEL'
ORDER BY argo_cv.gkey DESC
SQL;
    }
}
