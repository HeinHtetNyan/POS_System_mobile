import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useMemo } from 'react'
import type {
  CartItem, Product, CheckoutStep, PaymentMethod,
  SplitPayment, Sale, CartTotals,
} from '@/types'
import { TAX_RATE } from '@/lib/utils'

interface CartState {
  items: CartItem[]
  discount: number    // order-level %
  note: string

  // Checkout flow
  checkoutStep: CheckoutStep
  paymentMethod: PaymentMethod
  paymentAmount: string
  splitPayments: SplitPayment[]
  completedSale: Sale | null

  // Actions — cart
  addItem: (product: Product) => void
  removeItem: (id: string) => void
  updateQty: (id: string, qty: number) => void
  updateLineDiscount: (id: string, discount: number) => void
  setDiscount: (pct: number) => void
  setNote: (note: string) => void
  clearCart: () => void

  // Actions — checkout
  setCheckoutStep: (step: CheckoutStep) => void
  setPaymentMethod: (method: PaymentMethod) => void
  setPaymentAmount: (amount: string) => void
  addSplitPayment: (p: SplitPayment) => void
  removeSplitPayment: (index: number) => void
  completeSale: (sale: Sale) => void
  newSale: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      discount: 0,
      note: '',
      checkoutStep: 'cart',
      paymentMethod: 'cash',
      paymentAmount: '',
      splitPayments: [],
      completedSale: null,

      addItem: (product) => set(state => {
        const existing = state.items.find(i => i.id === product.id)
        if (existing) {
          return {
            items: state.items.map(i =>
              i.id === product.id ? { ...i, qty: i.qty + 1 } : i
            ),
          }
        }
        return { items: [...state.items, { ...product, qty: 1, lineDiscount: 0 }] }
      }),

      removeItem: (id) => set(state => ({ items: state.items.filter(i => i.id !== id) })),

      updateQty: (id, qty) => set(state => {
        if (qty <= 0) return { items: state.items.filter(i => i.id !== id) }
        return { items: state.items.map(i => i.id === id ? { ...i, qty } : i) }
      }),

      updateLineDiscount: (id, discount) => set(state => ({
        items: state.items.map(i => i.id === id ? { ...i, lineDiscount: discount } : i),
      })),

      setDiscount: (discount) => set({ discount }),
      setNote: (note) => set({ note }),

      clearCart: () => set({
        items: [], discount: 0, note: '',
        checkoutStep: 'cart', paymentAmount: '', splitPayments: [],
      }),

      setCheckoutStep: (checkoutStep) => set({ checkoutStep }),
      setPaymentMethod: (paymentMethod) => set({ paymentMethod, paymentAmount: '', splitPayments: [] }),
      setPaymentAmount: (paymentAmount) => set({ paymentAmount }),
      addSplitPayment: (p) => set(state => ({ splitPayments: [...state.splitPayments, p] })),
      removeSplitPayment: (index) => set(state => ({
        splitPayments: state.splitPayments.filter((_, i) => i !== index),
      })),

      completeSale: (sale) => set({ completedSale: sale, checkoutStep: 'receipt' }),

      newSale: () => set({
        items: [], discount: 0, note: '',
        checkoutStep: 'cart', paymentAmount: '', splitPayments: [],
        completedSale: null,
      }),
    }),
    {
      name: 'nexuspos-cart',
      partialize: (s) => ({ items: s.items, discount: s.discount, note: s.note }),
    },
  ),
)

// ─── Derived totals hook ──────────────────────────────────────────────────────
export function useCartTotals(): CartTotals {
  const items = useCartStore(s => s.items)
  const discount = useCartStore(s => s.discount)

  return useMemo(() => {
    const itemSubtotal = items.reduce((sum, item) => {
      const lineTotal = item.price * item.qty
      const lineDisc = (item.lineDiscount || 0) / 100 * lineTotal
      return sum + lineTotal - lineDisc
    }, 0)
    const orderDiscAmt = (discount || 0) / 100 * itemSubtotal
    const afterDiscount = itemSubtotal - orderDiscAmt
    const tax = Math.max(0, afterDiscount * TAX_RATE)
    const total = Math.max(0, afterDiscount + tax)
    const itemCount = items.reduce((s, i) => s + i.qty, 0)
    return {
      itemSubtotal: Math.round(itemSubtotal * 100) / 100,
      orderDiscAmt: Math.round(orderDiscAmt * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
      itemCount,
    }
  }, [items, discount])
}
