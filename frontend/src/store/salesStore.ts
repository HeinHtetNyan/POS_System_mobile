import { create } from 'zustand'
import type { Sale } from '@/types'
import { generateMockSales } from '@/lib/mockSales'

interface SalesState {
  sales: Sale[]
  setSales: (sales: Sale[]) => void
  addSale: (sale: Sale) => void
  updateSale: (id: string, updates: Partial<Sale>) => void
}

export const useSalesStore = create<SalesState>()((set) => ({
  sales: generateMockSales(),

  setSales: (sales) => set({ sales }),

  addSale: (sale) => set(state => ({ sales: [sale, ...state.sales] })),

  updateSale: (id, updates) => set(state => ({
    sales: state.sales.map(s => s.id === id ? { ...s, ...updates } : s),
  })),
}))
