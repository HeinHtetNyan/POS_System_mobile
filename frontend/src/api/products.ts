import apiClient from './client'
import type { Product, PaginatedResponse } from '@/types'

export const productsApi = {
  list: (params?: { category?: string; search?: string; page?: number }) =>
    apiClient.get<PaginatedResponse<Product>>('/products/', { params }).then(r => r.data),

  get: (id: string) =>
    apiClient.get<Product>(`/products/${id}/`).then(r => r.data),

  create: (data: Partial<Product>) =>
    apiClient.post<Product>('/products/', data).then(r => r.data),

  update: (id: string, data: Partial<Product>) =>
    apiClient.patch<Product>(`/products/${id}/`, data).then(r => r.data),

  delete: (id: string) =>
    apiClient.delete(`/products/${id}/`),

  adjustStock: (id: string, delta: number, reason: string) =>
    apiClient.post(`/products/${id}/adjust-stock/`, { delta, reason }).then(r => r.data),
}
