import Dexie, { Table } from 'dexie'
import type { CartItem, Customer, PendingSale, Product } from '../types'

export class PosDatabase extends Dexie {
  products!: Table<Product, number>
  customers!: Table<Customer, number>
  cartItems!: Table<CartItem & { id?: number }, number>
  pendingSales!: Table<PendingSale, number>

  constructor() {
    super('pos_db')
    this.version(1).stores({
      products:     'id, codigo_barras, descripcion',
      customers:    'id, nombre',
      cartItems:    '++id, productId',
      pendingSales: '++localId, createdAt',
    })
  }
}

export const db = new PosDatabase()

export async function syncProductsToCache(products: Product[]): Promise<void> {
  await db.products.clear()
  await db.products.bulkPut(products)
}

export async function syncCustomersToCache(customers: Customer[]): Promise<void> {
  await db.customers.clear()
  await db.customers.bulkPut(customers)
}

export async function getProductByBarcode(barcode: string): Promise<Product | undefined> {
  return db.products.where('codigo_barras').equals(barcode).first()
}
