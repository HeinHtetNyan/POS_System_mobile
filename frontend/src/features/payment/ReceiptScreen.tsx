import { useCartStore } from '@/store/cartStore'
import { fmt, fmtDateTime, STORE_NAME } from '@/lib/utils'
import { IconCheck, IconPrint } from '@/components/icons'

export default function ReceiptScreen() {
  const completedSale = useCartStore(s => s.completedSale)
  const newSale = useCartStore(s => s.newSale)

  if (!completedSale) return null

  const { id, date, items, subtotal, discount, tax, total, paymentMethod, amountTendered, change } = completedSale
  const visibleItems = items.slice(0, 4)
  const hiddenCount = items.length - visibleItems.length

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/95 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-5">
        {/* Success indicator */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center">
            <IconCheck width="28" height="28" className="text-green-400" />
          </div>
          <p className="text-lg font-bold text-zinc-100">Payment Complete</p>
          <p className="text-xs text-zinc-600 font-mono">{id}</p>
        </div>

        {/* Receipt card */}
        <div className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-zinc-800 text-center">
            <p className="text-sm font-semibold text-zinc-100">{STORE_NAME}</p>
            <p className="text-xs text-zinc-600 mt-0.5">{fmtDateTime(date)}</p>
          </div>

          {/* Items */}
          <div className="px-5 py-3 flex flex-col gap-1.5 border-b border-zinc-800">
            {visibleItems.map(item => (
              <div key={item.id} className="flex items-start justify-between gap-2 text-xs">
                <span className="text-zinc-400 flex-1 min-w-0">
                  {item.name}
                  <span className="text-zinc-600"> × {item.qty}</span>
                </span>
                <span className="font-mono text-zinc-200 flex-shrink-0">
                  {fmt(item.price * item.qty)}
                </span>
              </div>
            ))}
            {hiddenCount > 0 && (
              <p className="text-xs text-zinc-600 italic">+{hiddenCount} more item{hiddenCount > 1 ? 's' : ''}</p>
            )}
          </div>

          {/* Totals */}
          <div className="px-5 py-3 flex flex-col gap-1 border-b border-zinc-800">
            <div className="flex justify-between text-xs text-zinc-500">
              <span>Subtotal</span>
              <span className="font-mono">{fmt(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-xs text-amber-500">
                <span>Discount</span>
                <span className="font-mono">-{fmt(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs text-zinc-500">
              <span>Tax</span>
              <span className="font-mono">{fmt(tax)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-zinc-100 mt-1 pt-1 border-t border-zinc-800">
              <span>Total</span>
              <span className="font-mono text-amber-400">{fmt(total)}</span>
            </div>
          </div>

          {/* Payment info */}
          <div className="px-5 py-3 flex flex-col gap-1 text-xs text-zinc-500">
            <div className="flex justify-between">
              <span>Payment</span>
              <span className="capitalize text-zinc-300">{paymentMethod}</span>
            </div>
            {amountTendered !== undefined && amountTendered > 0 && (
              <div className="flex justify-between">
                <span>Tendered</span>
                <span className="font-mono text-zinc-300">{fmt(amountTendered)}</span>
              </div>
            )}
            {change !== undefined && change > 0 && (
              <div className="flex justify-between">
                <span>Change</span>
                <span className="font-mono text-green-400 font-semibold">{fmt(change)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 w-full">
          <button
            onClick={() => window.print()}
            className="flex-1 h-11 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-sm font-semibold flex items-center justify-center gap-2 transition-all"
          >
            <IconPrint width="15" height="15" />
            Print
          </button>
          <button
            onClick={newSale}
            className="flex-1 h-11 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-bold text-sm transition-all shadow-lg shadow-amber-900/30 active:scale-[0.98]"
          >
            New Sale
          </button>
        </div>
      </div>
    </div>
  )
}
