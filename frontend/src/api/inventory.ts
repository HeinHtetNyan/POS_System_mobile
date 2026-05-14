import apiClient from './client'
import type { Product, PaginatedResponse } from '@/types'

export const inventoryApi = {
  list: (params?: { low_stock?: boolean; out_of_stock?: boolean }) =>
    apiClient.get<PaginatedResponse<Product>>('/inventory/', { params }).then(r => r.data),

  adjust: (productId: string, payload: { delta: number; reason: string }) =>
    apiClient.post(`/inventory/${productId}/adjust/`, payload).then(r => r.data),

  movements: (productId: string) =>
    apiClient.get(`/inventory/${productId}/movements/`).then(r => r.data),
}
