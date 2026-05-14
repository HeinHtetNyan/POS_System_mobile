import { useRef, useEffect, useCallback } from 'react'
import { useCartStore, useCartTotals } from '@/store/cartStore'
import { useAppStore } from '@/store/appStore'
import { useProductsStore } from '@/store/productsStore'
import { IconSearch, IconBarcode } from '@/components/icons'
import { Kbd } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { Product } from '@/types'
import CategoryFilter from '@/features/pos/CategoryFilter'
import ProductGrid from '@/features/pos/ProductGrid'
import CartPanel from '@/features/pos/CartPanel'

// Lazy import — PaymentOverlay is only needed when checkoutStep !== 'cart'
import PaymentOverlay from '@/features/payment/PaymentOverlay'

export default function POSScreen() {
  const searchRef = useRef<HTMLInputElement>(null)

  const productSearch = useAppStore(s => s.productSearch)
  const setProductSearch = useAppStore(s => s.setProductSearch)
  const activeCategory = useAppStore(s => s.activeCategory)

  const products = useProductsStore(s => s.products)
  const addItem = useCartStore(s => s.addItem)
  const items = useCartStore(s => s.items)
  const clearCart = useCartStore(s => s.clearCart)
  const checkoutStep = useCartStore(s => s.checkoutStep)
  const setCheckoutStep = useCartStore(s => s.setCheckoutStep)
  const totals = useCartTotals()

  // Filter products
  const filtered = products.filter(p => {
    const matchCat = activeCategory === 'all' || p.category === activeCategory
    if (!matchCat) return false
    if (!productSearch.trim()) return true
    const q = productSearch.toLowerCase()
    return (
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.barcode.includes(q)
    )
  })

  const handleAdd = useCallback((product: Product) => {
    addItem(product)
  }, [addItem])

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA'

      if (e.key === 'F9') {
        e.preventDefault()
        if (items.length > 0 && checkoutStep === 'cart') {
          setCheckoutStep('payment')
        }
        return
      }

      if (e.key === 'Escape') {
        if (checkoutStep === 'cart') {
          clearCart()
        }
        return
      }

      if (e.key === '/' && !isInput) {
        e.preventDefault()
        searchRef.current?.focus()
        return
      }
    }

    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [items.length, checkoutStep, setCheckoutStep, clearCart])

  return (
    <div className="flex h-full overflow-hidden relative">
      {/* Left column — products */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Search bar */}
        <div className="flex items-center gap-2 px-3 pt-3 pb-2 flex-shrink-0">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none flex items-center">
              <IconSearch width="15" height="15" />
            </span>
            <input
              ref={searchRef}
              type="text"
              value={productSearch}
              onChange={e => setProductSearch(e.target.value)}
              placeholder="Search products…"
              className={cn(
                'w-full bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 text-sm',
                'focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all duration-150',
                'py-2.5 pl-9 pr-16',
              )}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1">
              <Kbd keys="/" />
            </span>
          </div>
          <button
            className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 flex items-center justify-center text-zinc-500 hover:text-zinc-200 transition-colors flex-shrink-0"
            aria-label="Scan barcode"
          >
            <IconBarcode width="17" height="17" />
          </button>
        </div>

        {/* Category filter */}
        <div className="px-3 pb-2 flex-shrink-0">
          <CategoryFilter />
        </div>

        {/* Product grid — scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <ProductGrid
            products={filtered}
            cartItems={items}
            onAdd={handleAdd}
          />
        </div>

        {/* Bottom shortcuts bar (large screens only) */}
        <div className="hidden lg:flex items-center justify-between px-4 py-2 border-t border-zinc-900 bg-zinc-950 text-[10px] text-zinc-700 flex-shrink-0">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><Kbd keys="/" /> search</span>
            <span className="flex items-center gap-1"><Kbd keys="F9" /> checkout</span>
            <span className="flex items-center gap-1"><Kbd keys="Esc" /> clear cart</span>
          </div>
          <span className="text-zinc-600 font-mono">{totals.itemCount} item{totals.itemCount !== 1 ? 's' : ''} in cart</span>
        </div>
      </div>

      {/* Right column — cart */}
      <CartPanel />

      {/* Payment overlay (when not in cart step) */}
      {checkoutStep !== 'cart' && <PaymentOverlay />}
    </div>
  )
}
