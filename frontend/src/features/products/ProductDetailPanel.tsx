import type { Product } from '@/types'
import { fmt, cn } from '@/lib/utils'
import { CATEGORIES_DATA } from '@/lib/constants'
import { useCartStore } from '@/store/cartStore'
import { useAppStore } from '@/store/appStore'
import { StockBadge, Btn } from '@/components/ui'
import { IconX, IconEdit, IconCart } from '@/components/icons'

interface ProductDetailPanelProps {
  product: Product
  onEdit: () => void
  onClose: () => void
}

export default function ProductDetailPanel({ product, onEdit, onClose }: ProductDetailPanelProps) {
  const addItem = useCartStore(s => s.addItem)
  const setScreen = useAppStore(s => s.setScreen)

  const category = CATEGORIES_DATA.find(c => c.id === product.category)
  const margin = product.price > 0
    ? (((product.price - product.cost) / product.price) * 100).toFixed(1)
    : '0.0'
  const taxPct = `${(product.taxRate * 100).toFixed(0)}%`
  const inventoryAtCost = product.stock * product.cost
  const inventoryAtRetail = product.stock * product.price

  function handleAddToCart() {
    addItem(product)
    setScreen('pos')
  }

  return (
    <div className="w-80 flex-shrink-0 border-l border-zinc-800 bg-zinc-950 flex flex-col animate-slideIn overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 flex-shrink-0">
        <span className="text-sm font-semibold text-zinc-100">Product Detail</span>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
        >
          <IconX width="14" height="14" />
        </button>
      </div>

      {/* Color stripe + identity */}
      <div className="flex-shrink-0">
        <div className="h-1.5 w-full" style={{ backgroundColor: product.color }} />
        <div className="px-4 py-4 border-b border-zinc-800">
          <p className="text-base font-semibold text-zinc-100 leading-tight">{product.name}</p>
          <div className="mt-1 flex flex-col gap-0.5">
            <span className="font-mono text-xs text-zinc-500">SKU: {product.sku}</span>
            {product.barcode && (
              <span className="font-mono text-xs text-zinc-600">Barcode: {product.barcode}</span>
            )}
          </div>
        </div>
      </div>

      {/* 2x2 metric grid */}
      <div className="grid grid-cols-2 gap-px bg-zinc-800 border-b border-zinc-800 flex-shrink-0">
        <div className="bg-amber-500/10 px-4 py-3 flex flex-col gap-0.5">
          <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Price</span>
          <span className="font-mono text-lg font-bold text-amber-400">{fmt(product.price)}</span>
        </div>
        <div className="bg-zinc-950 px-4 py-3 flex flex-col gap-0.5">
          <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Cost</span>
          <span className="font-mono text-lg font-bold text-zinc-100">{fmt(product.cost)}</span>
        </div>
        <div className="bg-zinc-950 px-4 py-3 flex flex-col gap-0.5">
          <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Margin</span>
          <span className="font-mono text-lg font-bold text-zinc-100">{margin}%</span>
        </div>
        <div className="bg-zinc-950 px-4 py-3 flex flex-col gap-0.5">
          <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Tax Rate</span>
          <span className="font-mono text-lg font-bold text-zinc-100">{taxPct}</span>
        </div>
      </div>

      {/* Stock card */}
      <div className="px-4 py-4 border-b border-zinc-800 flex-shrink-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Stock Level</span>
          <StockBadge stock={product.stock} />
        </div>
        <div className="flex items-baseline gap-1.5 mt-2">
          <span className={cn(
            'font-mono text-4xl font-bold',
            product.stock === 0 ? 'text-red-400' : product.stock <= 10 ? 'text-amber-400' : 'text-green-400',
          )}>
            {product.stock}
          </span>
          <span className="text-zinc-500 text-sm">{product.unit}</span>
        </div>
      </div>

      {/* Category pill */}
      <div className="px-4 py-3 border-b border-zinc-800 flex-shrink-0">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider block mb-2">Category</span>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border"
          style={{
            backgroundColor: `${product.color}20`,
            borderColor: `${product.color}40`,
            color: product.color,
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: product.color }} />
          {category?.name ?? product.category}
        </span>
      </div>

      {/* Inventory value card */}
      <div className="px-4 py-4 border-b border-zinc-800 flex-shrink-0">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider block mb-3">Inventory Value</span>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2">
            <p className="text-[10px] text-zinc-500 mb-0.5">At Cost</p>
            <p className="font-mono text-sm font-semibold text-zinc-100">{fmt(inventoryAtCost)}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2">
            <p className="text-[10px] text-zinc-500 mb-0.5">At Retail</p>
            <p className="font-mono text-sm font-semibold text-amber-400">{fmt(inventoryAtRetail)}</p>
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Footer actions */}
      <div className="px-4 py-4 border-t border-zinc-800 flex gap-2 flex-shrink-0">
        <Btn variant="secondary" size="sm" onClick={onEdit} className="flex-1">
          <IconEdit width="14" height="14" />
          Edit
        </Btn>
        <Btn variant="primary" size="sm" onClick={handleAddToCart} className="flex-1">
          <IconCart width="14" height="14" />
          Add to Cart
        </Btn>
      </div>
    </div>
  )
}
