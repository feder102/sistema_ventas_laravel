import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { customersApi, type CustomerPayload } from '../api/customers'
import { syncCustomersToCache } from '../db'

const QUERY_KEY = 'customers'

export function useCustomers(params?: { search?: string }) {
  return useQuery({
    queryKey:  [QUERY_KEY, params],
    queryFn:   async () => {
      const res = await customersApi.list(params)
      if (!params?.search) {
        void syncCustomersToCache(res.data.data)
      }
      return res.data.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CustomerPayload) =>
      customersApi.create(payload).then((r) => r.data.data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}

export function useUpdateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<CustomerPayload> }) =>
      customersApi.update(id, payload).then((r) => r.data.data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}

export function useDeleteCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => customersApi.destroy(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}
