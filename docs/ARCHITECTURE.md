# Architecture

## System Overview

The modernized POS is split into two independent deployable units:

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Compose                        │
│                                                          │
│  ┌────────────┐   ┌────────────┐   ┌────────────────┐  │
│  │  Frontend  │   │    API     │   │     MySQL      │  │
│  │ React + TS │──▶│ Laravel 11 │──▶│   8.0+         │  │
│  │ Vite 5     │   │ PHP 8.3    │   └────────────────┘  │
│  │ Port 5173  │   │ Port 8000  │   ┌────────────────┐  │
│  └─────┬──────┘   └────────────┘   │     Redis      │  │
│        │                           │  (cache/queue) │  │
│        │ localStorage (Zustand)    └────────────────┘  │
│        │ cart persistence                               │
└─────────────────────────────────────────────────────────┘
```

## Tech Decisions

| Concern | Choice | Rationale |
|---|---|---|
| API framework | Laravel 11 / PHP 8.3 | Strict types, readonly properties, first-class enums |
| Auth | Laravel Sanctum (SPA tokens) | Simpler than Passport for same-origin SPA; cookie-based + token fallback |
| Frontend | React 18 + TypeScript | Component model fits POS screen decomposition |
| Build | Vite 5 | Fast HMR, native ESM |
| Client state | Zustand | Minimal boilerplate for cart/UI state |
| Server state | TanStack Query v5 | Caching, background refetch, offline detection |
| Offline DB | Dexie.js (IndexedDB) | Typed wrappers, good React hooks |
| Styling | Tailwind CSS v3 | Touch-friendly utilities, no runtime CSS-in-JS |
| Printer | Browser Print API / escpos-web | Platform-agnostic; Windows ESC/POS removed |
| Cache | Redis | Sessions, queue, API response cache |

## Folder Structure

### Backend (`/api`)

```
api/
├── app/
│   ├── Domain/
│   │   ├── Products/
│   │   │   ├── Models/Product.php
│   │   │   ├── Repositories/ProductRepository.php
│   │   │   └── Services/ProductService.php
│   │   ├── Sales/
│   │   │   ├── Models/Sale.php
│   │   │   ├── Models/SaleItem.php
│   │   │   ├── Repositories/SaleRepository.php
│   │   │   └── Services/SaleService.php
│   │   ├── Customers/
│   │   │   ├── Models/Customer.php
│   │   │   ├── Repositories/CustomerRepository.php
│   │   │   └── Services/CustomerService.php
│   │   └── Users/
│   │       ├── Models/User.php
│   │       └── Services/UserService.php
│   ├── Http/
│   │   ├── Controllers/Api/
│   │   │   ├── AuthController.php
│   │   │   ├── ProductController.php
│   │   │   ├── CustomerController.php
│   │   │   ├── SaleController.php
│   │   │   └── UserController.php
│   │   ├── Requests/
│   │   └── Resources/
│   └── Providers/
├── database/
│   ├── migrations/
│   └── seeders/
├── routes/
│   └── api.php
└── tests/
    └── Feature/
```

### Frontend (`/frontend`)

```
frontend/
├── src/
│   ├── api/           # TanStack Query hooks + axios client
│   ├── components/    # Shared UI components
│   ├── db/            # Dexie.js schema + offline tables
│   ├── pages/         # Route-level page components
│   │   ├── pos/       # POS / sell screen
│   │   ├── products/
│   │   ├── customers/
│   │   ├── sales/
│   │   └── users/
│   ├── store/         # Zustand stores (cart, auth)
│   └── types/         # Shared TypeScript types
├── public/
└── vite.config.ts
```

## Data Flow: Complete Sale

```
User scans barcode
        │
        ▼
CartStore (Zustand) ──── stock check (local)
        │                 └── if offline: Dexie products cache
        │                 └── if online: TanStack Query cache
        ▼
"Complete Sale" pressed
        │
        ▼
POST /api/sales ◄── optimistic update in CartStore
        │
   ┌────┴────┐
   │ online  │  SaleService::create()
   │         │   - DB transaction
   │         │   - Insert sale + items
   │         │   - Decrement stock
   │         │   - Return Sale resource
   └────┬────┘
        │
   ┌────┴────┐
   │ offline │  IndexedDB pending_sales queue
   │         │  Background sync when reconnects
   └─────────┘
```

## Offline Strategy

1. **Products catalog**: synced to IndexedDB on login and every 5 min via TanStack Query background refetch
2. **Customers list**: synced to IndexedDB on login
3. **Cart**: lives in Zustand + persisted to localStorage via `persist` middleware (survives page reload; not cross-tab)
4. **Pending sales**: stored in IndexedDB `pending_sales` table; processed by a background sync worker when connectivity is restored
5. **Conflict resolution**: server is the source of truth for stock; a sale that fails due to insufficient stock is surfaced to the cashier on next sync

## Security

- All API routes require Sanctum authentication
- Passwords hashed with bcrypt (cost factor 12)
- No raw SQL — all queries via Eloquent or Query Builder with bindings
- CORS configured to allow only the frontend origin
- Rate limiting on auth endpoints (60/min login, 10/min signup)
