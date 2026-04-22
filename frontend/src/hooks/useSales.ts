import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { salesApi, type SalePayload } from '../api/sales'

const QUERY_KEY = 'sales'

export function useSales(params?: { from?: string; to?: string; customer_id?: number }) {
  return useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn:  () => salesApi.list(params).then((r) => r.data.data),
  })
}

export function useSale(id: number) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn:  () => salesApi.show(id).then((r) => r.data.data),
    enabled:  id > 0,
  })
}

export function useCreateSale() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: SalePayload) =>
      salesApi.create(payload).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}

export function useDeleteSale() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => salesApi.destroy(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}
