# App Specification Prompt
## Laravel 12 + ReactJS + InertiaJS — Vessel Operations Dashboard

---

## Stack

Build a full-stack web application using **Laravel 12**, **ReactJS**, and **InertiaJS**. All UI styling must use **TailwindCSS**. Use **Vite** as the asset bundler (Laravel default). Do not use Livewire or Blade views for interactive pages — all frontend rendering goes through Inertia + React. Place React pages in `resources/js/Pages/` and shared components in `resources/js/Components/`.

---

## Environment Configuration

Scaffold the `.env` file and all relevant Laravel config files with the following values. These must **never** be hardcoded in source files — always read from `.env` via `env()`.

### Local MySQL (default connection)
```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=your_local_db
DB_USERNAME=your_local_user
DB_PASSWORD=your_local_password
```

### Remote SQL Server connection (named `sqlsrv_remote`)
Add a second connection entry in `config/database.php` named `sqlsrv_remote`:
```
DB_SQLSRV_HOST=n4dbsrvvm
DB_SQLSRV_PORT=1433
DB_SQLSRV_DATABASE=xxxxxx        # <-- fill in actual DB name
DB_SQLSRV_USERNAME=xxxxxxx       # <-- fill in actual username
DB_SQLSRV_PASSWORD=xxxxxxx       # <-- fill in actual password
```

`config/database.php` entry:
```php
'sqlsrv_remote' => [
    'driver'   => 'sqlsrv',
    'host'     => env('DB_SQLSRV_HOST', 'n4dbsrvvm'),
    'port'     => env('DB_SQLSRV_PORT', 1433),
    'database' => env('DB_SQLSRV_DATABASE'),
    'username' => env('DB_SQLSRV_USERNAME'),
    'password' => env('DB_SQLSRV_PASSWORD'),
    'charset'  => 'utf8',
    'prefix'   => '',
],
```

### LDAP (LdapRecord-Laravel)
Add to `.env`:
```
LDAP_DEFAULT_HOSTS=192.168.11.249
LDAP_DEFAULT_USERNAME=dictdevuser@anflocor.local
LDAP_DEFAULT_PASSWORD=r32cbHXWJ4DYAj
LDAP_DEFAULT_PORT=389
LDAP_DEFAULT_BASE_DN="dc=anflocor,dc=local"
LDAP_DEFAULT_TIMEOUT=5
LDAP_DEFAULT_SSL=false
LDAP_DEFAULT_TLS=false
```

Scaffold `config/ldap.php` using `env()` for all values above. Enable database sync so authenticated LDAP users are upserted into the local `users` table on first login.

---

## Database Migrations

Create the following migrations for the local MySQL database:

### 1. `vessel_visits` table
Stores synced rows from the remote SQL Server query. Columns map directly to the query output:

| Column | Type | Notes |
|---|---|---|
| `id` | bigIncrements | local PK |
| `ob_ib_id` | string | from `argo_cv.gkey` — use as unique key for upsert |
| `vessel_name` | string | |
| `service` | string | |
| `vessel_id` | string | |
| `phase` | string | |
| `line_op` | string | |
| `total_planned_loading_wi` | integer | |
| `load_plan_fcl_20ft` | integer | |
| `load_plan_fcl_40ft` | integer | |
| `load_plan_empty_20ft` | integer | |
| `load_plan_empty_40ft` | integer | |
| `total_loaded_count` | integer | |
| `loaded_fcl_20ft` | integer | |
| `loaded_fcl_40ft` | integer | |
| `loaded_empty_20ft` | integer | |
| `loaded_empty_40ft` | integer | |
| `total_planned_discharge` | integer | |
| `discharge_plan_fcl_20ft` | integer | |
| `discharge_plan_fcl_40ft` | integer | |
| `discharge_plan_mty_20ft` | integer | |
| `discharge_plan_mty_40ft` | integer | |
| `total_discharged_count` | integer | |
| `discharged_fcl_20ft` | integer | |
| `discharged_fcl_40ft` | integer | |
| `discharged_empty_20ft` | integer | |
| `discharged_empty_40ft` | integer | |
| `synced_at` | timestamp | set to `now()` on each sync |
| `timestamps` | — | standard created_at / updated_at |

### 2. `sync_logs` table
Tracks every scheduler run.

| Column | Type | Notes |
|---|---|---|
| `id` | bigIncrements | |
| `ran_at` | timestamp | when the job ran |
| `rows_fetched` | integer | rows returned from SQLSRV |
| `rows_upserted` | integer | rows written/updated in MySQL |
| `status` | enum: `success`, `failed` | |
| `error_message` | text, nullable | filled on failure |
| `duration_ms` | integer | execution time in ms |
| `timestamps` | — | |

---

## Scheduled Data Sync Job

### Job class: `App\Jobs\SyncVesselVisitsJob`

Create a queued job (or artisan command) registered in `App\Console\Kernel` (or via `routes/console.php` in Laravel 12) to run **every hour**:

```php
Schedule::job(new SyncVesselVisitsJob)->hourly();
```

### Job logic:

1. Record start time.
2. Connect to `sqlsrv_remote` using `DB::connection('sqlsrv_remote')`.
3. Execute the following raw SQL query exactly as written:

```sql
SELECT TOP 10
    argo_cv.gkey as ob_ib_id,
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
    WHERE fcy_visit.actual_ib_cv = argo_cv.gkey AND unit.id NOT LIKE '%DUMM%' AND unit.id NOT LIKE '%SAMM%') as total_planned_discharge,
    (SELECT count(*)
    FROM [sparcsn4].[dbo].[inv_unit] as unit
    INNER JOIN [sparcsn4].[dbo].[inv_unit_fcy_visit] as fcy_visit ON unit.gkey=fcy_visit.unit_gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equipment] as ref_eq ON unit.eq_gkey = ref_eq.gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equip_type] as eq_type ON ref_eq.eqtyp_gkey = eq_type.gkey
    WHERE fcy_visit.actual_ib_cv = argo_cv.gkey AND unit.id NOT LIKE '%DUMM%' AND unit.id NOT LIKE '%SAMM%'
    AND unit.freight_kind = 'FCL' AND eq_type.basic_length = 'BASIC20') as discharge_plan_fcl_20ft,
    (SELECT count(*)
    FROM [sparcsn4].[dbo].[inv_unit] as unit
    INNER JOIN [sparcsn4].[dbo].[inv_unit_fcy_visit] as fcy_visit ON unit.gkey=fcy_visit.unit_gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equipment] as ref_eq ON unit.eq_gkey = ref_eq.gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equip_type] as eq_type ON ref_eq.eqtyp_gkey = eq_type.gkey
    WHERE fcy_visit.actual_ib_cv = argo_cv.gkey AND unit.id NOT LIKE '%DUMM%' AND unit.id NOT LIKE '%SAMM%'
    AND unit.freight_kind = 'FCL' AND eq_type.basic_length = 'BASIC40') as discharge_plan_fcl_40ft,
    (SELECT count(*)
    FROM [sparcsn4].[dbo].[inv_unit] as unit
    INNER JOIN [sparcsn4].[dbo].[inv_unit_fcy_visit] as fcy_visit ON unit.gkey=fcy_visit.unit_gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equipment] as ref_eq ON unit.eq_gkey = ref_eq.gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equip_type] as eq_type ON ref_eq.eqtyp_gkey = eq_type.gkey
    WHERE fcy_visit.actual_ib_cv = argo_cv.gkey AND unit.id NOT LIKE '%DUMM%' AND unit.id NOT LIKE '%SAMM%'
    AND unit.freight_kind = 'MTY' AND eq_type.basic_length = 'BASIC20') as discharge_plan_mty_20ft,
    (SELECT count(*)
    FROM [sparcsn4].[dbo].[inv_unit] as unit
    INNER JOIN [sparcsn4].[dbo].[inv_unit_fcy_visit] as fcy_visit ON unit.gkey=fcy_visit.unit_gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equipment] as ref_eq ON unit.eq_gkey = ref_eq.gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equip_type] as eq_type ON ref_eq.eqtyp_gkey = eq_type.gkey
    WHERE fcy_visit.actual_ib_cv = argo_cv.gkey AND unit.id NOT LIKE '%DUMM%' AND unit.id NOT LIKE '%SAMM%'
    AND unit.freight_kind = 'MTY' AND eq_type.basic_length = 'BASIC40') as discharge_plan_mty_40ft,
    (SELECT count(*)
    FROM [sparcsn4].[dbo].[inv_unit] as unit
    INNER JOIN [sparcsn4].[dbo].[inv_unit_fcy_visit] as fcy_visit ON unit.gkey=fcy_visit.unit_gkey
    WHERE fcy_visit.actual_ib_cv = argo_cv.gkey AND unit.id NOT LIKE '%DUMM%' AND unit.id NOT LIKE '%SAMM%'
    AND unit.category IN ('IMPRT','TRSHP','THRGH') AND fcy_visit.transit_state in ('S30_ECIN','S40_YARD')) as total_discharged_count,
    (SELECT count(*)
    FROM [sparcsn4].[dbo].[inv_unit] as unit
    INNER JOIN [sparcsn4].[dbo].[inv_unit_fcy_visit] as fcy_visit ON unit.gkey=fcy_visit.unit_gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equipment] as ref_eq ON unit.eq_gkey = ref_eq.gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equip_type] as eq_type ON ref_eq.eqtyp_gkey = eq_type.gkey
    WHERE fcy_visit.actual_ib_cv = argo_cv.gkey AND unit.id NOT LIKE '%DUMM%' AND unit.id NOT LIKE '%SAMM%'
    AND unit.category IN ('IMPRT','TRSHP','THRGH') AND unit.freight_kind = 'FCL'
    AND fcy_visit.transit_state in ('S30_ECIN','S40_YARD') AND eq_type.basic_length = 'BASIC20') as discharged_fcl_20ft,
    (SELECT count(*)
    FROM [sparcsn4].[dbo].[inv_unit] as unit
    INNER JOIN [sparcsn4].[dbo].[inv_unit_fcy_visit] as fcy_visit ON unit.gkey=fcy_visit.unit_gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equipment] as ref_eq ON unit.eq_gkey = ref_eq.gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equip_type] as eq_type ON ref_eq.eqtyp_gkey = eq_type.gkey
    WHERE fcy_visit.actual_ib_cv = argo_cv.gkey AND unit.id NOT LIKE '%DUMM%' AND unit.id NOT LIKE '%SAMM%'
    AND unit.category IN ('IMPRT','TRSHP','THRGH') AND unit.freight_kind = 'FCL'
    AND fcy_visit.transit_state in ('S30_ECIN','S40_YARD') AND eq_type.basic_length = 'BASIC40') as discharged_fcl_40ft,
    (SELECT count(*)
    FROM [sparcsn4].[dbo].[inv_unit] as unit
    INNER JOIN [sparcsn4].[dbo].[inv_unit_fcy_visit] as fcy_visit ON unit.gkey=fcy_visit.unit_gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equipment] as ref_eq ON unit.eq_gkey = ref_eq.gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equip_type] as eq_type ON ref_eq.eqtyp_gkey = eq_type.gkey
    WHERE fcy_visit.actual_ib_cv = argo_cv.gkey AND unit.id NOT LIKE '%DUMM%' AND unit.id NOT LIKE '%SAMM%'
    AND unit.category IN ('IMPRT','TRSHP','THRGH') AND unit.freight_kind = 'MTY'
    AND fcy_visit.transit_state in ('S30_ECIN','S40_YARD') AND eq_type.basic_length = 'BASIC20') as discharged_empty_20ft,
    (SELECT count(*)
    FROM [sparcsn4].[dbo].[inv_unit] as unit
    INNER JOIN [sparcsn4].[dbo].[inv_unit_fcy_visit] as fcy_visit ON unit.gkey=fcy_visit.unit_gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equipment] as ref_eq ON unit.eq_gkey = ref_eq.gkey
    INNER JOIN [sparcsn4].[dbo].[ref_equip_type] as eq_type ON ref_eq.eqtyp_gkey = eq_type.gkey
    WHERE fcy_visit.actual_ib_cv = argo_cv.gkey AND unit.id NOT LIKE '%DUMM%' AND unit.id NOT LIKE '%SAMM%'
    AND unit.category IN ('IMPRT','TRSHP','THRGH') AND unit.freight_kind = 'MTY'
    AND fcy_visit.transit_state in ('S30_ECIN','S40_YARD') AND eq_type.basic_length = 'BASIC40') as discharged_empty_40ft
FROM [sparcsn4].[dbo].vsl_vessels as vvsl
INNER JOIN [sparcsn4].[dbo].vsl_vessel_visit_details as vvsl_vd ON vvsl.gkey=vvsl_vd.vessel_gkey
INNER JOIN [sparcsn4].[dbo].argo_carrier_visit as argo_cv ON vvsl_vd.vvd_gkey=argo_cv.cvcvd_gkey
INNER JOIN [sparcsn4].[dbo].argo_visit_details as argo_vd ON argo_vd.gkey=argo_cv.cvcvd_gkey
INNER JOIN [sparcsn4].[dbo].ref_carrier_service as ref_c_service ON argo_vd.service=ref_c_service.gkey
INNER JOIN [sparcsn4].[dbo].ref_bizunit_scoped as ref_biz ON ref_biz.gkey=vvsl_vd.bizu_gkey
WHERE argo_cv.phase IN ('40WORKING','30ARRIVED') AND argo_cv.carrier_mode='VESSEL'
ORDER BY argo_cv.gkey DESC;
```

4. Use `DB::connection('sqlsrv_remote')->select($query)` to fetch results.
5. For each row, use `VesselVisit::updateOrCreate(['ob_ib_id' => $row->ob_ib_id], [...all columns..., 'synced_at' => now()])` to upsert into the local `vessel_visits` table.
6. Write a `SyncLog` record with `ran_at`, `rows_fetched`, `rows_upserted`, `status`, `duration_ms`, and `error_message` (null on success).
7. On any exception, catch it, log to Laravel log, write a `SyncLog` with `status = 'failed'` and the exception message in `error_message`, then rethrow or fail gracefully.

---

## Authentication — LdapRecord-Laravel

Install: `composer require directorytree/ldaprecord-laravel`

Configure `config/ldap.php` using the following `.env` values (already listed above). Enable **database authentication** so LDAP users sync into the local `users` table. The login form should be a simple LDAP username (samAccountName or email) + password form at `/login`, rendered as an Inertia + React page with TailwindCSS styling.

Middleware `auth` protects all `/admin/*` routes. Unauthenticated requests redirect to `/login`.

---

## Route Structure

```
GET  /              → redirect to /dashboard (public TV display)
GET  /dashboard     → public, no auth — Inertia page: Pages/Dashboard.jsx
GET  /login         → guest only — Inertia page: Pages/Auth/Login.jsx
POST /login         → LDAP auth handler
POST /logout        → auth only
GET  /admin         → auth — Inertia page: Pages/Admin/Home.jsx
GET  /admin/logs    → auth — Inertia page: Pages/Admin/SyncLogs.jsx
```

---

## Public TV Dashboard — `/dashboard`

This page is the primary deliverable visible on a TV screen. Requirements:

- **No authentication required.** No nav bar, no login button, no header clutter.
- **Dark theme** — near-black background (`#0a0e17` or similar deep navy), high-contrast white/cyan text.
- **Large typography** — minimum 1.5rem for data values, 3rem+ for headline numbers. Designed to be read clearly at 3–5 meters from a 1080p or 4K TV.
- **16:9 layout** — use CSS Grid or Flexbox to fill the full viewport (`100vw × 100vh`), no scrollbars.
- **Auto-refresh every 60 seconds** — use a `useEffect` with `setInterval` that calls a JSON API endpoint (`/api/dashboard-data`) to re-fetch without full page reload. Show a subtle "last updated" timestamp in the corner.
- **Data to display per vessel** (one card/row per vessel visit from `vessel_visits` where `phase IN ('40WORKING', '30ARRIVED')`):
  - Vessel name + service + line operator + phase badge
  - **Loading section**: Planned (total_planned_loading_wi), Loaded (total_loaded_count), broken down by FCL 20ft / FCL 40ft / Empty 20ft / Empty 40ft
  - **Discharge section**: Planned (total_planned_discharge), Discharged (total_discharged_count), broken down by FCL 20ft / FCL 40ft / Empty 20ft / Empty 40ft
  - Progress bar or ratio indicator showing loaded vs planned and discharged vs planned
- **Sync status strip** at the bottom — last sync time, row count, status (green = success, red = failed).
- **Phase badge color coding**: `40WORKING` = amber/orange, `30ARRIVED` = cyan/blue.
- Tailwind classes only. No external CSS libraries.

---

## Admin Area — `/admin`

Protected by `auth` middleware. Inertia + React pages with a simple sidebar nav.

### `/admin` — Home
Summary cards: total vessel visits synced, last sync time, sync success/failure count this week.

### `/admin/logs` — Sync Logs
Paginated table of `sync_logs` ordered by `ran_at` DESC. Columns: ran_at, rows_fetched, rows_upserted, status (colored badge), duration_ms, error_message (truncated with expand). Use Laravel pagination passed through Inertia props.

---

## API Endpoint for Dashboard Polling

```
GET /api/dashboard-data   → no auth — returns JSON
```

Returns the latest `vessel_visits` rows where `phase IN ('40WORKING', '30ARRIVED')`, plus the most recent `sync_logs` entry. This is consumed by the React polling hook on the public dashboard.

---

## Project Conventions & Structure

```
app/
  Console/
    Kernel.php                  ← schedule hourly job here
  Jobs/
    SyncVesselVisitsJob.php
  Models/
    VesselVisit.php
    SyncLog.php
    User.php                    ← extended with LdapRecord sync
  Http/
    Controllers/
      Auth/LoginController.php
      Admin/HomeController.php
      Admin/SyncLogController.php
      Api/DashboardController.php
      DashboardController.php

resources/js/
  Pages/
    Dashboard.jsx               ← public TV display
    Auth/Login.jsx
    Admin/Home.jsx
    Admin/SyncLogs.jsx
  Components/
    VesselCard.jsx
    SyncStatusBar.jsx
    ProgressBar.jsx
    AdminLayout.jsx

database/migrations/
  xxxx_create_vessel_visits_table.php
  xxxx_create_sync_logs_table.php
```

All sensitive values in `.env` only. Add `.env` to `.gitignore`. Provide a `.env.example` with all keys and blank or placeholder values.

---

## README.md

Include setup steps:
1. `composer install`
2. `npm install && npm run build`
3. Copy `.env.example` to `.env`, fill in all values
4. `php artisan key:generate`
5. `php artisan migrate`
6. `php artisan ldap:import` (optional, for pre-seeding LDAP users)
7. Add cron entry: `* * * * * cd /path-to-project && php artisan schedule:run >> /dev/null 2>&1`
8. `php artisan serve` (or configure with nginx/apache for production)

---

## Security Notes

- LDAP password and SQL Server credentials are in `.env` only — never in committed code.
- The public `/dashboard` and `/api/dashboard-data` routes expose only aggregated count data — no PII.
- CSRF protection is active on all POST routes.
- The `sqlsrv_remote` connection is read-only by intent — the sync job only calls `DB::connection('sqlsrv_remote')->select(...)`, never write operations on that connection.
