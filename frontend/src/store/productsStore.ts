import { create } from 'zustand'
import type { Product } from '@/types'
import { PRODUCTS_DATA } from '@/lib/constants'

interface ProductsState {
  products: Product[]
  setProducts: (products: Product[]) => void
  updateProduct: (product: Product) => void
  adjustStock: (id: string, delta: number) => void
  addProduct: (product: Product) => void
}

export const useProductsStore = create<ProductsState>()((set) => ({
  products: PRODUCTS_DATA,

  setProducts: (products) => set({ products }),

  updateProduct: (product) => set(state => ({
    products: state.products.map(p => p.id === product.id ? product : p),
  })),

  adjustStock: (id, delta) => set(state => ({
    products: state.products.map(p =>
      p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p
    ),
  })),

  addProduct: (product) => set(state => ({
    products: [...state.products, product],
  })),
}))
