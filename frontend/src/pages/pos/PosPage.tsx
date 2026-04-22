import { FormEvent, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProducts } from '../../hooks/useProducts'
import { useCustomers } from '../../hooks/useCustomers'
import { useCreateSale } from '../../hooks/useSales'
import { useCartStore } from '../../store/cartStore'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useToast } from '../../components/ui/Toast'
import type { AxiosError } from 'axios'
import type { ApiError } from '../../types'

export function PosPage() {
  const { data: products = [] }  = useProducts()
  const { data: customers = [] } = useCustomers()
  const createSale               = useCreateSale()
  const navigate                 = useNavigate()
  const { toast }                = useToast()

  const {
    items, customerId, total,
    addByBarcode, removeItem, setQuantity, setCustomer, clear,
  } = useCartStore()

  const [barcode, setBarcode]       = useState('')
  const [scanError, setScanError]   = useState('')
  const [stockErrors, setStockErrors] = useState<Record<number, string>>({})
  const barcodeRef = useRef<HTMLInputElement>(null)

  function handleScan(e: FormEvent) {
    e.preventDefault()
    if (!barcode.trim()) return
    const msg = addByBarcode(barcode.trim(), products)
    setScanError(msg ?? '')
    setBarcode('')
    barcodeRef.current?.focus()
  }

  async function handleCompleteSale() {
    if (items.length === 0) return
    setStockErrors({})
    try {
      const sale = await createSale.mutateAsync({
        customer_id: customerId,
        items:       items.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
      })
      clear()
      toast('Venta completada', 'success')
      navigate(`/sales/${sale.id}`)
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>
      const errors   = axiosErr.response?.data?.errors ?? {}
      const mapped: Record<number, string> = {}
      items.forEach((item, idx) => {
        const key = `items.${idx}.quantity`
        if (errors[key]) mapped[item.productId] = errors[key][0]
      })
      setStockErrors(mapped)
      toast('Error al completar la venta', 'error')
    }
  }

  function handleCancel() {
    if (window.confirm('¿Cancelar la venta? Se perderán los productos del carrito.')) {
      clear()
      toast('Venta cancelada', 'info')
    }
  }

  const grandTotal = total()

  return (
    <div className="py-6">
      <h1 className="text-2xl font-bold mb-4">Nueva venta</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart */}
        <div className="lg:col-span-2">
          {items.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center text-gray-500">
              <p className="text-lg">Escanea un código de barras o escríbelo abajo</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left">Código</th>
                      <th className="px-4 py-3 text-left">Descripción</th>
                      <th className="px-4 py-3 text-right">Precio</th>
                      <th className="px-4 py-3 text-center">Cantidad</th>
                      <th className="px-4 py-3 text-right">Subtotal</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((item) => (
                      <tr
                        key={item.productId}
                        className={stockErrors[item.productId] ? 'bg-red-50' : ''}
                      >
                        <td className="px-4 py-3 font-mono text-xs">{item.barcode}</td>
                        <td className="px-4 py-3">
                          <div>{item.descripcion}</div>
                          {stockErrors[item.productId] && (
                            <div className="text-xs text-red-600">{stockErrors[item.productId]}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">${item.unit_price.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              aria-label="Restar"
                              onClick={() => setQuantity(item.productId, item.quantity - 1)}
                              className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              inputMode="decimal"
                              min={0.01}
                              step={0.01}
                              value={item.quantity}
                              onChange={(e) => setQuantity(item.productId, parseFloat(e.target.value) || 0)}
                              className="w-16 text-center border rounded-lg py-1 text-sm"
                            />
                            <button
                              aria-label="Sumar"
                              onClick={() => setQuantity(item.productId, item.quantity + 1)}
                              className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          ${(item.unit_price * item.quantity).toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => removeItem(item.productId)}
                            aria-label="Quitar"
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-right font-semibold">Total</td>
                      <td className="px-4 py-3 text-right font-bold text-lg text-blue-700">
                        ${grandTotal.toFixed(2)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-4">
          {/* Barcode scan */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="font-semibold mb-3">Agregar producto</h2>
            <form onSubmit={handleScan} className="flex flex-col gap-2">
              <Input
                ref={barcodeRef}
                id="barcode"
                label="Código de barras"
                value={barcode}
                onChange={(e) => { setBarcode(e.target.value); setScanError('') }}
                autoFocus
                autoComplete="off"
                placeholder="Escanea o escribe..."
                error={scanError}
              />
              <Button type="submit" variant="secondary" size="sm">Agregar</Button>
            </form>
          </div>

          {/* Customer */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="font-semibold mb-3">Cliente</h2>
            <select
              value={customerId ?? ''}
              onChange={(e) => setCustomer(e.target.value ? Number(e.target.value) : null)}
              className="w-full border rounded-lg px-3 py-2.5 min-h-[44px] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Sin cliente (venta anónima) —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button
              variant="success"
              size="lg"
              disabled={items.length === 0}
              loading={createSale.isPending}
              onClick={handleCompleteSale}
              className="w-full"
            >
              ✓ Terminar venta · ${grandTotal.toFixed(2)}
            </Button>
            {items.length > 0 && (
              <Button variant="danger" size="md" onClick={handleCancel} className="w-full">
                Cancelar venta
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
