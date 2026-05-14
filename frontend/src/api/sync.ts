import apiClient from './client'
import type { SyncOperation } from '@/types'

export const syncApi = {
  push: (operations: SyncOperation[]) =>
    apiClient.post('/sync/push/', { operations }).then(r => r.data),

  pull: (since?: string) =>
    apiClient.get('/sync/pull/', { params: { since } }).then(r => r.data),

  registerDevice: (info: { deviceId: string; name: string; branchId: string }) =>
    apiClient.post('/devices/register/', info).then(r => r.data),
}
