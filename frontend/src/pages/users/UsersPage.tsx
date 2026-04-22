import { useState } from 'react'
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '../../hooks/useUsers'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { useToast } from '../../components/ui/Toast'
import type { User } from '../../types'
import type { UserPayload } from '../../api/users'

function UserForm({
  initial,
  onSave,
  loading,
}: {
  initial?: User
  onSave:   (data: UserPayload) => void
  loading:  boolean
}) {
  const [form, setForm] = useState<UserPayload>({
    name:                  initial?.name  ?? '',
    email:                 initial?.email ?? '',
    password:              '',
    password_confirmation: '',
  })

  return (
    <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); onSave(form) }}>
      <Input label="Nombre" value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <Input label="Correo" type="email" value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })} required />
      <Input label={initial ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña'}
        type="password" value={form.password ?? ''}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        required={!initial} />
      <Input label="Confirmar contraseña" type="password" value={form.password_confirmation ?? ''}
        onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
        required={!initial} />
      <Button type="submit" loading={loading}>{initial ? 'Actualizar' : 'Guardar'}</Button>
    </form>
  )
}

export function UsersPage() {
  const [modal, setModal]       = useState<'create' | User | null>(null)
  const { data: users = [], isLoading } = useUsers()
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const deleteUser = useDeleteUser()
  const { toast }  = useToast()

  async function handleSave(payload: UserPayload) {
    try {
      if (modal === 'create') {
        await createUser.mutateAsync(payload)
        toast('Usuario guardado', 'success')
      } else if (modal && typeof modal === 'object') {
        await updateUser.mutateAsync({ id: modal.id, payload })
        toast('Usuario actualizado', 'success')
      }
      setModal(null)
    } catch {
      toast('Error al guardar', 'error')
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!window.confirm(`¿Eliminar al usuario "${name}"?`)) return
    await deleteUser.mutateAsync(id)
    toast('Usuario eliminado', 'info')
  }

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <Button onClick={() => setModal('create')}>+ Agregar</Button>
      </div>

      {isLoading ? (
        <p className="text-center py-12 text-gray-500">Cargando...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">Correo</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3 flex gap-2 justify-end">
                    <Button size="sm" variant="secondary" onClick={() => setModal(u)}>Editar</Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(u.id, u.name)}>
                      Eliminar
                    </Button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={3} className="text-center py-8 text-gray-400">Sin usuarios</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal === 'create' ? 'Agregar usuario' : 'Editar usuario'}
      >
        <UserForm
          initial={modal !== 'create' && modal !== null ? modal : undefined}
          onSave={handleSave}
          loading={createUser.isPending || updateUser.isPending}
        />
      </Modal>
    </div>
  )
}
