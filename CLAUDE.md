# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Docker (recommended — all-in-one dev environment)

```bash
# First-time setup
cp .env.example .env
docker compose up --build
docker compose exec app php artisan key:generate
docker compose exec app php artisan migrate

# Day-to-day
docker compose up          # starts app (port 8080), nginx, vite HMR (port 5173)
docker compose down
docker compose exec app php artisan <command>
```

### Without Docker (requires PHP 8.3+, Node 22, MySQL locally)

```bash
composer run setup         # installs deps, generates key, migrates, seeds
composer run dev           # starts Laravel server + queue worker + log tail + Vite concurrently
npm run dev                # Vite only
npm run build              # production frontend build
```

### Testing & Linting

```bash
composer run test          # runs PHPUnit
php artisan test           # equivalent
php artisan test --filter=TestName   # single test
./vendor/bin/pint          # Laravel Pint (PHP code style fixer)
```

## Architecture

### Dual-interface design

There are two separate UIs served from this app:

1. **Public TV Dashboard** (`/dashboard`) — a full-page auto-refreshing Inertia page (`Dashboard.jsx`) that polls `/api/dashboard-data`. No authentication required. Designed for large screens in port operations rooms.

2. **Admin Panel SPA** (`/admin-panel/*`) — a client-side React SPA using JWT auth (not Inertia page transitions). The entire SPA is mounted via a single Inertia page (`Admin/App.jsx`) which handles its own routing internally. JWT tokens are obtained via `POST /api/auth/login`.

The non-SPA admin area (`/admin`, `/admin/logs`) is server-rendered Inertia with standard LDAP session auth.

### Authentication — two separate systems

- **Web routes** (`/login`, `/admin`, `/admin/logs`): LDAP authentication via `LdapRecord-Laravel`. Users authenticate against Active Directory. Session-based.
- **API routes** (`/api/auth/*`, `/api/admin/*`): JWT authentication via `php-open-source-saver/jwt-auth`. Uses the `AdminUser` model (stored in local MySQL), not LDAP users. Roles: `admin` and `superadmin` (enforced by `AdminRole` middleware).

### Data flow — dual database

- **MySQL** (`DB_CONNECTION=mysql`): Local database. Stores `users`, `admin_users`, `vessel_visits` (synced copy), `sync_logs`, `vessel_plan_overrides`, sessions, cache, jobs.
- **SQL Server** (`DB_SQLSRV_HOST=n4dbsrvvm`): Remote read-only legacy system. `SyncVesselVisitsJob` pulls from it hourly via Laravel's task scheduler and upserts into `vessel_visits`. Never written to.

The `VesselPlanOverride` model allows admins to override planned cargo/call figures for a specific vessel visit (`ob_ib_id` key) without modifying the synced source data.

### Frontend (React + Inertia)

- Entry point: `resources/js/app.jsx`
- Pages map 1:1 to Inertia controller responses. Controllers return `Inertia::render('PageName', $props)`.
- `HandleInertiaRequests` middleware injects shared data (auth user, etc.) available to all pages via `usePage().props`.
- TailwindCSS v4 is configured via the `@tailwindcss/vite` Vite plugin — there is no `tailwind.config.js`; config lives in CSS.
- `recharts` is used for vessel cargo bar charts (`VesselBarChart.jsx`).

### Key models

| Model | Connection | Description |
|---|---|---|
| `User` | mysql | LDAP-synced AD users (web auth) |
| `AdminUser` | mysql | Local JWT users for admin-panel SPA |
| `VesselVisit` | mysql | Hourly-synced vessel operations data |
| `SyncLog` | mysql | History of sync jobs (success/failure/counts) |
| `VesselPlanOverride` | mysql | Admin-entered overrides keyed by `ob_ib_id` |

### Scheduled job

`SyncVesselVisitsJob` runs hourly. It connects to the remote SQL Server, fetches vessel visit records, and upserts them into the local `vessel_visits` table. Requires the queue worker running (`php artisan queue:work` or `php artisan schedule:run`). `composer run dev` starts this automatically.

### Docker environment

The `docker-compose.yml` wires `host.docker.internal` and `n4dbsrvvm` (192.168.11.211) as extra hosts so the PHP container can reach the remote SQL Server. The production compose (`docker-compose.prod.yml`) includes a local MySQL service and uses `.env.production`.
