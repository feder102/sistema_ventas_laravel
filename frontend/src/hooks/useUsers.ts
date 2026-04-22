import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usersApi, type UserPayload } from '../api/users'

const QUERY_KEY = 'users'

export function useUsers() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn:  () => usersApi.list().then((r) => r.data.data),
  })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UserPayload) =>
      usersApi.create(payload).then((r) => r.data.data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<UserPayload> }) =>
      usersApi.update(id, payload).then((r) => r.data.data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => usersApi.destroy(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}
