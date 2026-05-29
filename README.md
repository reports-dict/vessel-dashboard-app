# Vessel Operations Dashboard

A full-stack port operations dashboard built with **Laravel 13**, **React**, **InertiaJS**, and **TailwindCSS 4**.

## Features

- **Public TV Dashboard** (`/dashboard`) — real-time vessel loading/discharge progress, auto-refreshes every 60 s, designed for 1080p/4K TV display
- **Admin Area** (`/admin`) — LDAP-authenticated, shows sync stats and detailed sync logs
- **Automated sync** — hourly scheduled job pulls live data from a remote SQL Server (SPARCS N4) and upserts into local MySQL

---

## Stack

| Layer | Technology |
|---|---|
| Backend | Laravel 13, PHP 8.3 |
| Frontend | React 18, Inertia.js v2 |
| Styling | TailwindCSS v4 |
| Auth | LdapRecord-Laravel (AD/LDAP) |
| Local DB | MySQL 8 |
| Remote DB | SQL Server (read-only) |
| Bundler | Vite |

---

## Local Setup

### Prerequisites

- PHP 8.2+
- Composer
- Node 20+
- MySQL 8
- PHP extensions: `pdo_mysql`, `pdo_sqlsrv` (for SQL Server), `ldap`

### Steps

```bash
# 1. Install PHP dependencies
composer install

# 2. Install JS dependencies
npm install --legacy-peer-deps

# 3. Copy and configure environment
cp .env.example .env

# Edit .env — fill in:
#   DB_* (local MySQL credentials)
#   DB_SQLSRV_* (remote SQL Server credentials)
#   LDAP_DEFAULT_PASSWORD

# 4. Generate application key
php artisan key:generate

# 5. Run database migrations
php artisan migrate

# 6. (Optional) Pre-seed LDAP users
php artisan ldap:import

# 7. Build front-end assets
npm run build
# or for development:
npm run dev

# 8. Start Laravel development server
php artisan serve
```

### Cron (for scheduler)

Add to your server's crontab:

```cron
* * * * * cd /path/to/vessel-dashboard-app && php artisan schedule:run >> /dev/null 2>&1
```

---

## Docker — Development

```bash
# Copy env and fill in credentials
cp .env.example .env

# Build and start all services
docker compose up --build

# First time: generate key and migrate
docker compose exec app php artisan key:generate
docker compose exec app php artisan migrate
```

Services:

| Service | URL |
|---|---|
| App (nginx) | http://localhost:8080 |
| Vite HMR | http://localhost:5173 |
| MySQL | localhost:3306 |

---

## Docker — Production

```bash
# Create production env file
cp .env.example .env.production
# Edit .env.production with production values

docker compose -f docker-compose.prod.yml up --build -d

# Run migrations
docker compose -f docker-compose.prod.yml exec app php artisan migrate --force
docker compose -f docker-compose.prod.yml exec app php artisan config:cache
docker compose -f docker-compose.prod.yml exec app php artisan route:cache
```

The production image builds front-end assets at image build time (no Node at runtime), runs PHP-FPM, queue worker, and the scheduler all under `supervisord`.

---

## Route Summary

| Method | URL | Access | Description |
|---|---|---|---|
| GET | `/` | public | Redirect to `/dashboard` |
| GET | `/dashboard` | public | TV dashboard |
| GET | `/login` | guest | LDAP login form |
| POST | `/login` | guest | Authenticate |
| POST | `/logout` | auth | Sign out |
| GET | `/admin` | auth | Admin overview |
| GET | `/admin/logs` | auth | Sync log table |
| GET | `/api/dashboard-data` | public | JSON data for polling |

---

## Security Notes

- All credentials are in `.env` only — never committed.
- `/dashboard` and `/api/dashboard-data` expose aggregated counts only — no PII.
- The `sqlsrv_remote` connection is read-only by design (`SELECT` only).
- CSRF protection is active on all POST routes.
