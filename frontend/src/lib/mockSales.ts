import type { Sale } from '@/types'
import { PRODUCTS_DATA, USERS_DATA } from './constants'

export function generateMockSales(): Sale[] {
  const methods = ['cash', 'card', 'split'] as const
  const statuses = ['completed','completed','completed','completed','completed','refunded','voided'] as const

  return Array.from({ length: 38 }, (_, i) => {
    const date = new Date(Date.now() - i * 3_600_000 * (1 + Math.random() * 5))
    const prods = PRODUCTS_DATA.filter(() => Math.random() > 0.72).slice(0, 5)
    const items = (prods.length ? prods : [PRODUCTS_DATA[i % PRODUCTS_DATA.length]])
      .map(p => ({ id: p.id, name: p.name, sku: p.sku, price: p.price, taxRate: p.taxRate, qty: Math.ceil(Math.random() * 3) }))
    const subtotal = Math.round(items.reduce((s, it) => s + it.price * it.qty, 0) * 100) / 100
    const discount = Math.random() > 0.8 ? Math.round(subtotal * 0.1 * 100) / 100 : 0
    const tax = Math.round((subtotal - discount) * 0.1 * 100) / 100
    const total = Math.round((subtotal - discount + tax) * 100) / 100
    return {
      id: `ORD-${String(10000 + i).padStart(5, '0')}`,
      date,
      cashier: USERS_DATA[i % 2],
      items,
      subtotal,
      discount,
      tax,
      total,
      paymentMethod: methods[i % 3],
      status: statuses[i % statuses.length],
    } satisfies Sale
  })
}
