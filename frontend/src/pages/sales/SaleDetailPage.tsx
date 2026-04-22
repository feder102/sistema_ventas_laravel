import { Link, useParams } from 'react-router-dom'
import { useSale } from '../../hooks/useSales'
import { Button } from '../../components/ui/Button'

export function SaleDetailPage() {
  const { id }             = useParams<{ id: string }>()
  const { data: sale, isLoading } = useSale(Number(id))

  if (isLoading) return <p className="text-center py-12 text-gray-500">Cargando...</p>
  if (!sale)     return <p className="text-center py-12 text-red-500">Venta no encontrada</p>

  return (
    <div className="py-6 max-w-2xl">
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <Link to="/sales"><Button variant="secondary" size="sm">← Volver</Button></Link>
        <h1 className="text-2xl font-bold">Venta #{sale.id}</h1>
        <Link to={`/sales/${sale.id}/print`} target="_blank">
          <Button variant="ghost" size="sm">🖨️ Imprimir ticket</Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
        <p className="text-gray-600 text-sm">
          <strong>Cliente:</strong> {sale.customer?.nombre ?? '— Anónimo —'}
        </p>
        <p className="text-gray-600 text-sm mt-1">
          <strong>Fecha:</strong>{' '}
          {new Date(sale.created_at).toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' })}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">Descripción</th>
              <th className="px-4 py-3 text-left">Código</th>
              <th className="px-4 py-3 text-right">Precio</th>
              <th className="px-4 py-3 text-right">Cantidad</th>
              <th className="px-4 py-3 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sale.items?.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3">{item.descripcion}</td>
                <td className="px-4 py-3 font-mono text-xs">{item.codigo_barras}</td>
                <td className="px-4 py-3 text-right">${item.unit_price}</td>
                <td className="px-4 py-3 text-right">{item.quantity}</td>
                <td className="px-4 py-3 text-right font-medium">${item.subtotal}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan={4} className="px-4 py-3 text-right font-semibold">Total</td>
              <td className="px-4 py-3 text-right font-bold text-lg text-blue-700">${sale.total}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
