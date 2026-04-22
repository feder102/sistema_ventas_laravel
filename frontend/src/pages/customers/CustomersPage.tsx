import { useState } from 'react'
import { useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from '../../hooks/useCustomers'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { useToast } from '../../components/ui/Toast'
import type { Customer } from '../../types'
import type { CustomerPayload } from '../../api/customers'

function CustomerForm({
  initial,
  onSave,
  loading,
}: {
  initial?: Customer
  onSave: (data: CustomerPayload) => void
  loading: boolean
}) {
  const [form, setForm] = useState<CustomerPayload>({
    nombre:   initial?.nombre   ?? '',
    telefono: initial?.telefono ?? '',
  })

  return (
    <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); onSave(form) }}>
      <Input label="Nombre" value={form.nombre}
        onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
      <Input label="Teléfono" value={form.telefono}
        onChange={(e) => setForm({ ...form, telefono: e.target.value })} required />
      <Button type="submit" loading={loading}>{initial ? 'Actualizar' : 'Guardar'}</Button>
    </form>
  )
}

export function CustomersPage() {
  const [search, setSearch] = useState('')
  const [modal, setModal]   = useState<'create' | Customer | null>(null)
  const { data: customers = [], isLoading } = useCustomers({ search: search || undefined })
  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer()
  const deleteCustomer = useDeleteCustomer()
  const { toast } = useToast()

  async function handleSave(payload: CustomerPayload) {
    try {
      if (modal === 'create') {
        await createCustomer.mutateAsync(payload)
        toast('Cliente guardado', 'success')
      } else if (modal && typeof modal === 'object') {
        await updateCustomer.mutateAsync({ id: modal.id, payload })
        toast('Cliente actualizado', 'success')
      }
      setModal(null)
    } catch {
      toast('Error al guardar', 'error')
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!window.confirm(`¿Eliminar a "${name}"?`)) return
    await deleteCustomer.mutateAsync(id)
    toast('Cliente eliminado', 'info')
  }

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <Button onClick={() => setModal('create')}>+ Agregar</Button>
      </div>

      <div className="mb-4">
        <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <p className="text-center py-12 text-gray-500">Cargando...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">Teléfono</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{c.nombre}</td>
                  <td className="px-4 py-3 text-gray-600">{c.telefono}</td>
                  <td className="px-4 py-3 flex gap-2 justify-end">
                    <Button size="sm" variant="secondary" onClick={() => setModal(c)}>Editar</Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(c.id, c.nombre)}>
                      Eliminar
                    </Button>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr><td colSpan={3} className="text-center py-8 text-gray-400">Sin resultados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal === 'create' ? 'Agregar cliente' : 'Editar cliente'}
      >
        <CustomerForm
          initial={modal !== 'create' && modal !== null ? modal : undefined}
          onSave={handleSave}
          loading={createCustomer.isPending || updateCustomer.isPending}
        />
      </Modal>
    </div>
  )
}
