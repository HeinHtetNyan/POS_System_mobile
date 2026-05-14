import { create } from 'zustand'
import type { SyncOperation } from '@/types'
import { genId } from '@/lib/utils'

interface SyncState {
  syncQueue: SyncOperation[]
  syncStatus: 'idle' | 'syncing' | 'error'
  lastSync: Date | null

  // Actions
  enqueue: (type: SyncOperation['type'], payload?: unknown) => void
  startSync: () => void
  syncSuccess: () => void
  syncError: () => void
  retrySyncItem: (id: string) => void
  dismissSyncItem: (id: string) => void
}

const INITIAL_QUEUE: SyncOperation[] = [
  { id: 'sq001', type: 'SALE_CREATE',      status: 'pending', createdAt: new Date(Date.now() - 120_000), retries: 0 },
  { id: 'sq002', type: 'INVENTORY_UPDATE', status: 'failed',  createdAt: new Date(Date.now() - 300_000), retries: 3 },
  { id: 'sq003', type: 'SALE_CREATE',      status: 'pending', createdAt: new Date(Date.now() - 60_000),  retries: 0 },
]

export const useSyncStore = create<SyncState>()((set) => ({
  syncQueue: INITIAL_QUEUE,
  syncStatus: 'idle',
  lastSync: new Date(Date.now() - 480_000),

  enqueue: (type, payload) => set(state => ({
    syncQueue: [
      ...state.syncQueue,
      { id: genId('sq'), type, payload, status: 'pending', createdAt: new Date(), retries: 0 },
    ],
  })),

  startSync: () => set({ syncStatus: 'syncing' }),

  syncSuccess: () => set(state => ({
    syncStatus: 'idle',
    lastSync: new Date(),
    syncQueue: state.syncQueue.filter(op => op.status !== 'pending'),
  })),

  syncError: () => set({ syncStatus: 'error' }),

  retrySyncItem: (id) => set(state => ({
    syncQueue: state.syncQueue.map(op =>
      op.id === id ? { ...op, status: 'pending', retries: (op.retries || 0) + 1 } : op
    ),
  })),

  dismissSyncItem: (id) => set(state => ({
    syncQueue: state.syncQueue.filter(op => op.id !== id),
  })),
}))
