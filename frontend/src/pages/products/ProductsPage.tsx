import { useState } from 'react'
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '../../hooks/useProducts'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { useToast } from '../../components/ui/Toast'
import type { Product } from '../../types'
import type { ProductPayload } from '../../api/products'

function ProductForm({
  initial,
  onSave,
  loading,
}: {
  initial?: Product
  onSave: (data: ProductPayload) => void
  loading: boolean
}) {
  const [form, setForm] = useState<ProductPayload>({
    codigo_barras: initial?.codigo_barras ?? '',
    descripcion:   initial?.descripcion   ?? '',
    precio_compra: initial ? parseFloat(initial.precio_compra) : 0,
    precio_venta:  initial ? parseFloat(initial.precio_venta)  : 0,
    existencia:    initial ? parseFloat(initial.existencia)    : 0,
  })

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => { e.preventDefault(); onSave(form) }}
    >
      <Input label="Código de barras" value={form.codigo_barras}
        onChange={(e) => setForm({ ...form, codigo_barras: e.target.value })} required />
      <Input label="Descripción" value={form.descripcion}
        onChange={(e) => setForm({ ...form, descripcion: e.target.value })} required />
      <Input label="Precio de compra" type="number" inputMode="decimal" step="0.01" min="0"
        value={form.precio_compra}
        onChange={(e) => setForm({ ...form, precio_compra: parseFloat(e.target.value) })} required />
      <Input label="Precio de venta" type="number" inputMode="decimal" step="0.01" min="0.01"
        value={form.precio_venta}
        onChange={(e) => setForm({ ...form, precio_venta: parseFloat(e.target.value) })} required />
      <Input label="Existencia" type="number" inputMode="decimal" step="0.01" min="0"
        value={form.existencia}
        onChange={(e) => setForm({ ...form, existencia: parseFloat(e.target.value) })} required />
      <Button type="submit" loading={loading}>{initial ? 'Actualizar' : 'Guardar'}</Button>
    </form>
  )
}

export function ProductsPage() {
  const [search, setSearch]     = useState('')
  const [modal, setModal]       = useState<'create' | Product | null>(null)
  const { data: products = [], isLoading } = useProducts({ search: search || undefined })
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const deleteProduct = useDeleteProduct()
  const { toast } = useToast()

  async function handleSave(payload: ProductPayload) {
    try {
      if (modal === 'create') {
        await createProduct.mutateAsync(payload)
        toast('Producto guardado', 'success')
      } else if (modal && typeof modal === 'object') {
        await updateProduct.mutateAsync({ id: modal.id, payload })
        toast('Producto actualizado', 'success')
      }
      setModal(null)
    } catch {
      toast('Error al guardar', 'error')
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!window.confirm(`¿Eliminar "${name}"?`)) return
    await deleteProduct.mutateAsync(id)
    toast('Producto eliminado', 'info')
  }

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Productos</h1>
        <Button onClick={() => setModal('create')}>+ Agregar</Button>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Buscar por nombre o código..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <p className="text-gray-500 text-center py-12">Cargando...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Código</th>
                <th className="px-4 py-3 text-left">Descripción</th>
                <th className="px-4 py-3 text-right">P. Compra</th>
                <th className="px-4 py-3 text-right">P. Venta</th>
                <th className="px-4 py-3 text-right">Utilidad</th>
                <th className="px-4 py-3 text-right">Existencia</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{p.codigo_barras}</td>
                  <td className="px-4 py-3">{p.descripcion}</td>
                  <td className="px-4 py-3 text-right">${p.precio_compra}</td>
                  <td className="px-4 py-3 text-right font-medium">${p.precio_venta}</td>
                  <td className="px-4 py-3 text-right text-green-700">${p.utilidad}</td>
                  <td className={`px-4 py-3 text-right ${parseFloat(p.existencia) <= 5 ? 'text-red-600 font-semibold' : ''}`}>
                    {p.existencia}
                  </td>
                  <td className="px-4 py-3 flex gap-2 justify-end">
                    <Button size="sm" variant="secondary" onClick={() => setModal(p)}>Editar</Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(p.id, p.descripcion)}>
                      Eliminar
                    </Button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">Sin resultados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal === 'create' ? 'Agregar producto' : 'Editar producto'}
      >
        <ProductForm
          initial={modal !== 'create' && modal !== null ? modal : undefined}
          onSave={handleSave}
          loading={createProduct.isPending || updateProduct.isPending}
        />
      </Modal>
    </div>
  )
}
