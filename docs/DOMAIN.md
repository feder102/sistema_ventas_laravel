# Domain Model

## Entities

### User
Represents a cashier or administrator who can operate the POS.

| Field | Type | Rules |
|---|---|---|
| id | bigint PK | auto |
| name | string | required, max 255 |
| email | string | required, unique, valid email |
| password | string (bcrypt) | required, min 8, confirmed on create |
| created_at | timestamp | auto |
| updated_at | timestamp | auto |

**Business rules:**
- Email must be unique across all users
- Password is hashed before storage; never stored in plaintext
- On update, password is only re-hashed if a new non-empty value is provided (legacy system bug: it re-hashed on every update, including blanks — fixed)
- Any authenticated user has full access (no role system in legacy; kept flat for now)

---

### Customer (Cliente)
A customer associated with a sale. Required for every sale.

| Field | Type | Rules |
|---|---|---|
| id | bigint PK | auto |
| nombre | string | required, max 255 |
| telefono | string | required, max 50 |
| created_at | timestamp | auto |
| updated_at | timestamp | auto |

**Business rules:**
- Every sale must have a customer — anonymous/walk-in not supported (legacy constraint kept; ambiguity documented below)
- Deleting a customer cascades to their sales (legacy behavior kept; see edge case #1)

**Ambiguity #1 — Customer deletion cascade:**
The legacy schema cascades customer deletion to sales, which destroys sales history. Decision: in the new system we use `SET NULL` on `sales.customer_id` and make customer_id nullable. This preserves history while allowing customer removal. A `[Deleted Customer]` placeholder is shown in the UI.

---

### Product (Producto)
A product in the catalog that can be sold.

| Field | Type | Rules |
|---|---|---|
| id | bigint PK | auto |
| codigo_barras | string | required, max 100 |
| descripcion | string | required, max 255 |
| precio_compra | decimal(10,2) | required, >= 0 |
| precio_venta | decimal(10,2) | required, > 0 |
| existencia | decimal(10,2) | required, >= 0 |
| created_at | timestamp | auto |
| updated_at | timestamp | auto |

**Derived:**
- `utilidad` (profit margin) = precio_venta − precio_compra (computed, not stored)

**Business rules:**
- `codigo_barras` is not unique in legacy — duplicates are allowed. Decision: add a unique index; on duplicate barcode the first match wins during scan lookup. Migration step handles existing duplicates by appending `-DUP-{id}`.
- `existencia` is decimal (not integer) — supports fractional units (e.g. kg, liters)
- Stock cannot go below 0 via the POS flow; direct edit can set any value
- Deleting a product does NOT affect ProductoVendido rows (they are denormalized snapshots)

---

### Sale (Venta)
A completed transaction.

| Field | Type | Rules |
|---|---|---|
| id | bigint PK | auto |
| customer_id | bigint FK nullable | null = deleted customer |
| created_at | timestamp | auto |
| updated_at | timestamp | auto |

**Derived:**
- `total` = SUM(sale_items.quantity * sale_items.unit_price) — computed in query

**Business rules:**
- A sale is immutable once created (no editing line items after completion)
- Deleting a sale does NOT restore stock (legacy behavior documented; decision: keep it. Stock correction is done manually via product edit)
- A sale with zero items cannot be created

---

### SaleItem (ProductoVendido)
A line item within a sale. Denormalized snapshot at time of sale.

| Field | Type | Rules |
|---|---|---|
| id | bigint PK | auto |
| sale_id | bigint FK | cascade delete |
| descripcion | string | snapshot of product name at sale time |
| codigo_barras | string | snapshot of barcode at sale time |
| unit_price | decimal(10,2) | snapshot of precio_venta at sale time |
| quantity | decimal(10,2) | > 0 |
| created_at | timestamp | auto |
| updated_at | timestamp | auto |

**Business rules:**
- `unit_price` and `descripcion` are copied from the product at time of sale — price changes don't retroactively alter past sales
- `quantity` is decimal to support fractional units
- Cannot be negative

---

## Cart (Client-Side Concept)

The cart is not persisted in the database. In the legacy system it lived in PHP session. In the new system:
- Cart state lives in Zustand store in memory
- Cart is persisted to IndexedDB for offline durability and cross-tab consistency
- Each line item in the cart tracks: product snapshot (barcode, descripcion, precio_venta), quantity, and a `productId` for stock lookups
- When a sale is completed, the cart is cleared

**Cart business rules:**
1. Adding a barcode that is already in the cart increments quantity
2. Adding a product whose stock ≤ 0 is rejected with an error message
3. Adding more units than available stock is rejected
4. Quantity can be edited directly (replaces the scan-increment flow from the legacy system)
5. Cart total = SUM(item.quantity * item.precio_venta)

---

## Business Rules — Sale Completion Flow

```
1. Validate cart is not empty
2. Validate customer is selected (or null if walk-in — new system allows null)
3. BEGIN TRANSACTION
4. For each cart item:
   a. Re-fetch product from DB (prevents stale stock check)
   b. If product.existencia < item.quantity → abort with error
   c. Insert SaleItem row (snapshot descripcion, barcode, precio_venta, quantity)
   d. UPDATE products SET existencia = existencia - item.quantity WHERE id = item.id
5. Insert Sale row (customer_id, timestamps)
6. COMMIT
7. Clear cart
8. Return Sale with items
```

---

## Edge Cases

| # | Case | Legacy behavior | New behavior |
|---|---|---|---|
| 1 | Customer deleted while sale exists | CASCADE DELETE → sale lost | SET NULL → sale preserved |
| 2 | Same barcode scanned twice | Increments quantity | Increments quantity (same) |
| 3 | Stock = 0 when adding | Redirects with danger alert | Returns 422 with message |
| 4 | Quantity exceeds stock | Redirects with danger alert | Returns 422 with message |
| 5 | Sale deleted | Stock not restored | Stock not restored (same) |
| 6 | Password update with blank value | Re-hashes blank string | Ignores blank, keeps old hash |
| 7 | Duplicate barcode in catalog | First match returned | Unique constraint + migration fix |
| 8 | Fractional stock | Supported (decimal) | Supported (same) |
| 9 | No products in cart → complete sale | Session empty, venta created with 0 items | Rejected: 422 cart is empty |
| 10 | API sale POST | Creates Venta with no items, no stock update | Full atomic flow (see Sale Completion above) |
| 11 | Concurrent sale of last unit | No protection | DB-level row lock via transaction |

---

## No Taxes, No Discounts

The legacy system has zero discount or tax logic. The new system preserves this. If taxes/discounts are needed in the future, they should be added as:
- A `tax_rate` field on Sale (stored at time of sale)
- A `discount` field on SaleItem (per-line or per-sale)
Both are out of scope for this modernization.

---

## Ticket / Receipt

The legacy system used `mike42/escpos-php` with `WindowsPrintConnector` — Windows-only ESC/POS printing. This is replaced in the new frontend with:
- A browser print view (CSS `@media print`) that formats the receipt
- Optional: Web Serial API for ESC/POS on supported browsers

The receipt contains: sale date, customer name, itemized list (qty × description = subtotal), and total.
