import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, Product } from '../types'

interface CartState {
  items:      CartItem[]
  customerId: number | null

  addByBarcode:  (barcode: string, products: Product[]) => string | null
  addItem:       (product: Product) => string | null
  removeItem:    (productId: number) => void
  setQuantity:   (productId: number, qty: number) => void
  setCustomer:   (id: number | null) => void
  clear:         () => void
  total:         () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items:      [],
      customerId: null,

      addByBarcode(barcode, products) {
        const product = products.find((p) => p.codigo_barras === barcode)
        if (!product) return 'Producto no encontrado'
        return get().addItem(product)
      },

      addItem(product) {
        const stock = parseFloat(product.existencia)
        if (stock <= 0) return 'Sin existencia'

        const existing = get().items.find((i) => i.productId === product.id)
        if (existing) {
          const newQty = existing.quantity + 1
          if (newQty > stock) return `Solo ${stock} unidades disponibles`
          set((s) => ({
            items: s.items.map((i) =>
              i.productId === product.id ? { ...i, quantity: newQty } : i,
            ),
          }))
        } else {
          const newItem: CartItem = {
            productId:  product.id,
            barcode:    product.codigo_barras,
            descripcion: product.descripcion,
            unit_price: parseFloat(product.precio_venta),
            quantity:   1,
          }
          set((s) => ({ items: [...s.items, newItem] }))
        }
        return null
      },

      removeItem(productId) {
        set((s) => ({ items: s.items.filter((i) => i.productId !== productId) }))
      },

      setQuantity(productId, qty) {
        if (qty <= 0) {
          get().removeItem(productId)
          return
        }
        set((s) => ({
          items: s.items.map((i) =>
            i.productId === productId ? { ...i, quantity: qty } : i,
          ),
        }))
      },

      setCustomer(id) {
        set({ customerId: id })
      },

      clear() {
        set({ items: [], customerId: null })
      },

      total() {
        return get().items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0)
      },
    }),
    {
      name: 'pos_cart',
    },
  ),
)
