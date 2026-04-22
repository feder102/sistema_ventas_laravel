# Frontend

## Component Tree

```
App
├── AuthGuard (redirect to /login if unauthenticated)
│   └── Layout
│       ├── Navbar
│       │   ├── NavLink (Home, Products, Sell, Sales, Customers, Users)
│       │   └── UserMenu (name + logout)
│       └── <Outlet> (page content)
│           ├── HomePage          /
│           ├── PosPage           /sell
│           │   ├── BarcodeInput
│           │   ├── CartTable
│           │   │   └── CartRow (qty controls, remove button)
│           │   ├── CustomerSelector
│           │   ├── CartSummary (total)
│           │   └── SaleActions (Complete / Cancel)
│           ├── ProductsPage      /products
│           │   ├── ProductSearch
│           │   ├── ProductTable
│           │   │   └── ProductRow (edit / delete)
│           │   └── ProductModal (create / edit)
│           ├── CustomersPage     /customers
│           │   ├── CustomerTable
│           │   └── CustomerModal
│           ├── SalesPage         /sales
│           │   ├── SaleFilters (date range, customer)
│           │   └── SaleTable
│           │       └── SaleRow → SaleDetailPage
│           ├── SaleDetailPage    /sales/:id
│           │   ├── SaleItemTable
│           │   └── PrintReceiptButton
│           ├── UsersPage         /users
│           │   ├── UserTable
│           │   └── UserModal
│           └── LoginPage         /login (outside AuthGuard)
└── OfflineBanner (fixed top strip when navigator.onLine = false)
```

---

## State Management

### Zustand Stores

**`useAuthStore`**
```typescript
interface AuthStore {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => void; // restore from localStorage on boot
}
```

**`useCartStore`**
```typescript
interface CartItem {
  productId: number;
  barcode: string;
  descripcion: string;
  unit_price: number;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  customerId: number | null;
  addByBarcode: (barcode: string, products: Product[]) => void;
  addItem: (product: Product) => void;
  removeItem: (productId: number) => void;
  setQuantity: (productId: number, qty: number) => void;
  setCustomer: (id: number | null) => void;
  clear: () => void;
  total: number; // derived
}
```
The cart store is persisted to IndexedDB via `persist` middleware using a Dexie adapter.

**`useOnlineStore`**
```typescript
interface OnlineStore {
  isOnline: boolean;
  pendingSales: number; // count of queued offline sales
}
```

---

### TanStack Query — Server State

Each resource has a set of hooks:

```typescript
// Products
useProducts(params?: { search?: string; low_stock?: boolean })
useProduct(id: number)
useProductByBarcode(barcode: string)
useCreateProduct()
useUpdateProduct()
useDeleteProduct()

// Customers
useCustomers(params?: { search?: string })
useCustomer(id: number)
useCreateCustomer()
useUpdateCustomer()
useDeleteCustomer()

// Sales
useSales(params?: { from?: string; to?: string; customer_id?: number })
useSale(id: number)
useCreateSale()
useDeleteSale()

// Users
useUsers()
useCreateUser()
useUpdateUser()
useDeleteUser()

// Auth
useMe()
```

Query keys follow `['resource', params]` convention. On mutation success, the relevant list key is invalidated.

---

## Offline Strategy

### IndexedDB Schema (Dexie.js)

```typescript
class PosDatabase extends Dexie {
  products!: Table<Product>;
  customers!: Table<Customer>;
  cart!: Table<CartItem>;
  pending_sales!: Table<PendingSale>;

  constructor() {
    super('pos_db');
    this.version(1).stores({
      products: '++id, codigo_barras, descripcion',
      customers: '++id, nombre',
      cart: '++id, productId',
      pending_sales: '++localId, createdAt',
    });
  }
}
```

### Sync Strategy

1. **On login:** fetch all products and customers, store in IndexedDB
2. **While online:** TanStack Query's `staleTime: 5 * 60 * 1000` (5 min) + `refetchOnWindowFocus: true` keeps cache warm; writes through to IndexedDB on each successful fetch
3. **On barcode scan offline:** look up product in Dexie `products` table
4. **On sale completion offline:**
   - Write sale to `pending_sales` in Dexie
   - Deduct stock locally in Dexie `products` (optimistic, may be corrected on sync)
   - Show confirmation to cashier with "(offline — will sync)"
5. **On reconnect:** `navigator.onLine` event → drain `pending_sales` queue one by one → on success remove from Dexie → on stock error surface to cashier

### Offline Indicators

- `OfflineBanner` shown at top of every page when `!navigator.onLine`
- POS screen shows pending sale count badge
- Sync status shown in Navbar (syncing spinner / checkmark)

---

## POS Screen — Detailed Behavior

**Barcode input:**
- Auto-focused on mount and after every scan
- Enter key submits
- On submit: look up in TanStack Query cache (or Dexie if offline)
- If not found: error toast
- If found: call `cartStore.addByBarcode()`

**Cart table columns:** Barcode | Description | Unit Price | Quantity (editable) | Subtotal | Remove

**Quantity editing:**
- Tap +/− buttons (touch-friendly, min 44px tap targets)
- Or type directly in number input
- Blur or Enter confirms; quantity of 0 removes the item
- Server-side stock check at sale completion (not on every edit)

**Customer selector:**
- Searchable dropdown (combobox)
- "None / Walk-in" option (customer_id = null) — new behavior vs. legacy

**Complete Sale:**
1. Disabled if cart is empty
2. Calls `useCreateSale()` mutation
3. On success: clear cart, navigate to `/sales/{id}` (the new sale receipt view)
4. On 422 stock error: highlight affected items in red

**Cancel Sale:**
- Clears cart with confirmation dialog

---

## Touch UI Guidelines

- Minimum tap target: 44×44px (iOS HIG / WCAG 2.5.5)
- Numeric inputs: `inputMode="decimal"` to trigger numeric keyboard on mobile
- Row actions (edit/delete) use icon buttons with `aria-label`
- Tables scroll horizontally on small screens (`overflow-x: auto`)
- Modal dialogs close on backdrop tap
- The POS screen layout is two-column on tablet (cart left, input right) and single-column on phone

---

## Receipt / Ticket Print

A dedicated `/sales/:id/print` route renders a print-only layout:
- `@media print` hides navigation and buttons
- Content: date, customer name, item list with subtotals, grand total
- Triggered by `window.print()` from the Print button
- No server-side rendering needed

---

## Router

React Router v6 with `createBrowserRouter`:

```
/login
/                → redirect to /sell if logged in
/sell            → POS screen
/products        → product list
/customers       → customer list
/sales           → sales history
/sales/:id       → sale detail
/sales/:id/print → printable receipt (no nav)
/users           → user management
```
