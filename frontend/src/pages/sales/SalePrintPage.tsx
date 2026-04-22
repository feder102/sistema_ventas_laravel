import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useSale } from '../../hooks/useSales'

export function SalePrintPage() {
  const { id } = useParams<{ id: string }>()
  const { data: sale, isLoading } = useSale(Number(id))

  useEffect(() => {
    if (sale) {
      document.title = `Ticket #${sale.id}`
      setTimeout(() => window.print(), 500)
    }
  }, [sale])

  if (isLoading) return <p>Cargando...</p>
  if (!sale)     return <p>Venta no encontrada</p>

  return (
    <div className="p-4 max-w-xs mx-auto font-mono text-sm print:p-0">
      <style>{`@media print { body { margin: 0; } }`}</style>
      <div className="text-center font-bold text-base mb-2">Ticket de venta</div>
      <div className="text-center text-xs mb-1">
        {new Date(sale.created_at).toLocaleString('es-MX')}
      </div>
      <div className="text-xs mb-2">Cliente: {sale.customer?.nombre ?? '— Anónimo —'}</div>
      <div className="border-t border-dashed border-gray-400 my-2" />
      {sale.items?.map((item) => (
        <div key={item.id} className="flex justify-between text-xs mb-1">
          <span>{item.quantity}× {item.descripcion}</span>
          <span>${item.subtotal}</span>
        </div>
      ))}
      <div className="border-t border-dashed border-gray-400 my-2" />
      <div className="flex justify-between font-bold">
        <span>TOTAL</span>
        <span>${sale.total}</span>
      </div>
      <div className="text-center text-xs mt-4">Gracias por su compra</div>
    </div>
  )
}
