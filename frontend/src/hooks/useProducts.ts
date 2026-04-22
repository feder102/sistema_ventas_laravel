import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { productsApi, type ProductPayload } from '../api/products'
import { syncProductsToCache } from '../db'

const QUERY_KEY = 'products'

export function useProducts(params?: { search?: string; low_stock?: boolean }) {
  return useQuery({
    queryKey:  [QUERY_KEY, params],
    queryFn:   async () => {
      const res = await productsApi.list(params)
      if (!params?.search && !params?.low_stock) {
        void syncProductsToCache(res.data.data)
      }
      return res.data.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useProductByBarcode(barcode: string, enabled: boolean) {
  return useQuery({
    queryKey: [QUERY_KEY, 'barcode', barcode],
    queryFn:  () => productsApi.byBarcode(barcode).then((r) => r.data.data),
    enabled:  enabled && barcode.length > 0,
  })
}

export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ProductPayload) =>
      productsApi.create(payload).then((r) => r.data.data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}

export function useUpdateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<ProductPayload> }) =>
      productsApi.update(id, payload).then((r) => r.data.data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}

export function useDeleteProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => productsApi.destroy(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}
