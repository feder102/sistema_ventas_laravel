import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSales, useDeleteSale } from '../../hooks/useSales'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'

export function SalesPage() {
  const [from, setFrom] = useState('')
  const [to, setTo]     = useState('')
  const { data: sales = [], isLoading } = useSales({
    from: from || undefined,
    to:   to   || undefined,
  })
  const deleteSale = useDeleteSale()
  const { toast }  = useToast()

  async function handleDelete(id: number) {
    if (!window.confirm('¿Eliminar esta venta? El stock no se restaurará.')) return
    await deleteSale.mutateAsync(id)
    toast('Venta eliminada', 'info')
  }

  return (
    <div className="py-6">
      <h1 className="text-2xl font-bold mb-4">Ventas</h1>

      <div className="flex gap-4 mb-4 flex-wrap">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Desde</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm min-h-[44px]" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Hasta</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm min-h-[44px]" />
        </div>
      </div>

      {isLoading ? (
        <p className="text-center py-12 text-gray-500">Cargando...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sales.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">#{s.id}</td>
                  <td className="px-4 py-3">
                    {new Date(s.created_at).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="px-4 py-3">{s.customer?.nombre ?? '— Anónimo —'}</td>
                  <td className="px-4 py-3 text-right font-semibold text-blue-700">${s.total}</td>
                  <td className="px-4 py-3 flex gap-2 justify-end">
                    <Link to={`/sales/${s.id}`}>
                      <Button size="sm" variant="secondary">Ver</Button>
                    </Link>
                    <Link to={`/sales/${s.id}/print`} target="_blank">
                      <Button size="sm" variant="ghost">🖨️</Button>
                    </Link>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(s.id)}>
                      Eliminar
                    </Button>
                  </td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">Sin ventas</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
