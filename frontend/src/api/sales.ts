import apiClient from './client'
import type { Sale, PaginatedResponse } from '@/types'

export const salesApi = {
  list: (params?: { page?: number; status?: string; date_from?: string; date_to?: string }) =>
    apiClient.get<PaginatedResponse<Sale>>('/sales/', { params }).then(r => r.data),

  get: (id: string) =>
    apiClient.get<Sale>(`/sales/${id}/`).then(r => r.data),

  create: (data: Omit<Sale, 'id' | 'cashier'>) =>
    apiClient.post<Sale>('/sales/', data).then(r => r.data),

  refund: (id: string, reason?: string) =>
    apiClient.post<Sale>(`/sales/${id}/refund/`, { reason }).then(r => r.data),

  void: (id: string, reason?: string) =>
    apiClient.post<Sale>(`/sales/${id}/void/`, { reason }).then(r => r.data),

  receipt: (id: string) =>
    apiClient.get(`/sales/${id}/receipt/`).then(r => r.data),
}
