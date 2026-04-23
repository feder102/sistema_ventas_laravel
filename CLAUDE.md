# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Sistema Ventas Laravel** is a modernized POS (Point of Sale) system split into two independent deployable units:
- **Backend**: Laravel 11 REST API (PHP 8.3) at `/api`
- **Frontend**: React 18 + TypeScript + Vite 5 at `/frontend`
- **Services**: MySQL 8.0, Redis 7 for caching/sessions/queue

All services orchestrated via Docker Compose.

## Folder Structure

### Backend (`/api`)
Uses domain-driven design with layers:
- `app/Domain/` — business logic (Products, Sales, Customers, Users domains)
- `app/Http/Controllers/Api/` — REST endpoints
- `app/Http/Requests/` — form request validation
- `app/Http/Resources/` — API response transformers
- `database/migrations/` — schema changes
- `tests/Feature/` — integration tests

### Frontend (`/frontend`)
- `src/api/` — TanStack Query hooks + axios client
- `src/components/` — shared UI components
- `src/db/` — Dexie.js (IndexedDB) schema for offline data
- `src/pages/` — route-level pages (pos, products, customers, sales, users)
- `src/store/` — Zustand stores (cart, auth)
- `src/types/` — TypeScript interfaces

## Development Workflow

### Start the entire system
```bash
docker-compose up
# Frontend: http://localhost:5173
# API: http://localhost:8000
# MySQL: localhost:3306
# Redis: localhost:6379
```

### Backend development (inside `api/`)
```bash
# Run migrations
php artisan migrate

# Reset migrations (dev only)
php artisan migrate:fresh --seed

# Run tests
php artisan test

# Run single test
php artisan test tests/Feature/AuthControllerTest.php

# Lint PHP
./vendor/bin/pint

# Serve locally (outside Docker)
php artisan serve
```

### Frontend development (inside `frontend/`)
```bash
# Start dev server with HMR
npm run dev

# Type check
npm run build  # includes `tsc -b`

# Lint
npm run lint

# Build for production
npm run build
```

## Architecture Decisions

| Layer | Tech | Why |
|-------|------|-----|
| Backend | Laravel 11, Sanctum | Strict types, async-ready, simpler auth than Passport |
| Frontend | React 18 + TypeScript | Component model fits POS screen decomposition |
| Build | Vite 5 | Fast HMR, native ESM, no webpack config burden |
| State | Zustand (UI) + TanStack Query (server) | Minimal boilerplate, great DevTools |
| Offline | Dexie.js (IndexedDB) | Typed ORM, React hooks support |
| Cache | Redis | Sessions, queue, API response cache |
| Auth | Laravel Sanctum SPA tokens | Cookie + token fallback for same-origin SPA |

## Key Patterns

### Backend API Flow
1. Request → `routes/api.php` → Controller
2. Controller calls `Service` layer (business logic)
3. Service uses `Repository` for data access
4. Controller returns `Resource` (response transformer)
5. All routes protected by `auth:sanctum` middleware

### Frontend Data Flow
- **Real-time queries**: TanStack Query hooks (auto-cache, background refetch)
- **Offline support**: Dexie.js syncs to IndexedDB on login + every 5 min
- **Cart persistence**: Zustand + localStorage (survives page reload)
- **Pending sales**: IndexedDB queue; background sync on reconnect

### Authentication
- User logs in → receives a Sanctum **personal access token** (not a cookie)
- Token stored in `localStorage` under `pos_token`
- All API calls send `Authorization: Bearer <token>` via axios request interceptor
- On 401, interceptor clears localStorage and redirects to `/login`

## Common Tasks

### Add a new API endpoint
1. Create migration in `api/database/migrations/`
2. Create Model in `api/app/Domain/{Domain}/Models/`
3. Create Repository in `api/app/Domain/{Domain}/Repositories/`
4. Create Service in `api/app/Domain/{Domain}/Services/`
5. Create Controller in `api/app/Http/Controllers/Api/`
6. Create Resource in `api/app/Http/Resources/`
7. Register route in `api/routes/api.php`
8. Test with `php artisan test`

### Add a new frontend page
1. Create component in `src/pages/{feature}/`
2. Add TanStack Query hooks in `src/api/`
3. Add Zustand store if needed in `src/store/`
4. Register route in router
5. Test offline behavior by checking `src/db/` schema

### Database migration (production-safe)
1. Create reversible migration
2. Test locally: `php artisan migrate:fresh --seed`
3. Deploy: migration runs automatically on container startup

### Offline debugging
1. Check browser DevTools → Application → IndexedDB
2. Verify products/customers synced to `dexie_db`
3. Disable network and test cart operations
4. Check `pending_sales` queue on reconnect

## Important Notes

- **No raw SQL**: Use Eloquent or Query Builder with bindings (prevents injection)
- **Password hashing**: bcrypt with cost factor 12 (configured in `config/hashing.php`)
- **CORS**: Only frontend origins allowed (dev and production IPs in `docker-compose.yml`)
- **Rate limiting**: Auth endpoints throttled (60/min login, 10/min signup)
- **Migrations**: Marked `--force` in Docker to auto-run; never modify executed migrations
- **Redis key prefixes**: Used for sessions, cache, queue — check `.env` cache/session drivers
- **Type safety**: Frontend uses TypeScript strict mode; backend uses PHP 8.3 typed properties

## Environment Variables

Key variables in `.env` (copy from `.env.example`):
- `APP_KEY` — Laravel encryption key (generated during setup)
- `DB_*` — MySQL credentials
- `CACHE_STORE` — set to `redis`
- `SESSION_DRIVER` — set to `redis`
- `SANCTUM_STATEFUL_DOMAINS` — frontend dev/prod origins
- `CORS_ALLOWED_ORIGINS` — same as `SANCTUM_STATEFUL_DOMAINS`

## Testing Strategy

**Backend**: Feature tests hit real MySQL in Docker
```bash
php artisan test --filter AuthControllerTest
```

**Frontend**: No test framework configured; test manually in browser or add Vitest

## Deployment Notes

- Docker images build from `api/Dockerfile` and `frontend/Dockerfile`
- API migrations auto-run on startup (`php artisan migrate --force`)
- Frontend env vars: only `VITE_API_URL` is used (baked at build time)
- Redis data persists in volume across restarts
- MySQL data persists in `mysql_data` volume
