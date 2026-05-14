import { fmt } from '@/lib/utils'
import { IconPlus, IconMinus, IconX } from '@/components/icons'
import { useCartStore } from '@/store/cartStore'
import type { CartItem as CartItemType } from '@/types'

interface CartItemProps {
  item: CartItemType
}

export default function CartItem({ item }: CartItemProps) {
  const updateQty = useCartStore(s => s.updateQty)
  const removeItem = useCartStore(s => s.removeItem)

  const lineTotal =
    item.price * item.qty * (1 - (item.lineDiscount || 0) / 100)

  return (
    <div className="group flex items-start gap-2 px-3 py-2.5 hover:bg-zinc-800/50 rounded-lg transition-colors relative">
      {/* Remove button (hover) */}
      <button
        onClick={() => removeItem(item.id)}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 rounded flex items-center justify-center text-zinc-600 hover:text-red-400 hover:bg-red-950/50"
        aria-label="Remove item"
      >
        <IconX width="12" height="12" />
      </button>

      {/* Product info */}
      <div className="flex-1 min-w-0 pr-5">
        <p className="text-xs font-semibold text-zinc-100 line-clamp-1 leading-snug">
          {item.name}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="font-mono text-[11px] text-zinc-500">
            {fmt(item.price)} × {item.qty}
          </span>
          {item.lineDiscount > 0 && (
            <span className="text-[10px] text-amber-500 font-medium">
              -{item.lineDiscount}%
            </span>
          )}
        </div>
      </div>

      {/* Qty controls + line total */}
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <span className="font-mono text-xs font-bold text-zinc-100">
          {fmt(lineTotal)}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => updateQty(item.id, item.qty - 1)}
            className="w-6 h-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition-colors active:scale-90"
          >
            <IconMinus width="10" height="10" />
          </button>
          <span className="w-6 text-center font-mono text-xs font-semibold text-zinc-100 tabular-nums">
            {item.qty}
          </span>
          <button
            onClick={() => updateQty(item.id, item.qty + 1)}
            className="w-6 h-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition-colors active:scale-90"
          >
            <IconPlus width="10" height="10" />
          </button>
        </div>
      </div>
    </div>
  )
}
