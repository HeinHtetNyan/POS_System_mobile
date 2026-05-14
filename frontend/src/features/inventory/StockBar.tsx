import { cn } from '@/lib/utils'

interface StockBarProps {
  stock: number
  max?: number
}

export default function StockBar({ stock, max = 200 }: StockBarProps) {
  const pct = Math.min(100, (stock / Math.max(max, 1)) * 100)

  const isOut  = stock === 0
  const isLow  = stock > 0 && stock <= 10

  const barColor  = isOut ? 'bg-red-500'   : isLow ? 'bg-amber-500'   : 'bg-green-500'
  const textColor = isOut ? 'text-red-400'  : isLow ? 'text-amber-400' : 'text-green-400'

  return (
    <div className="flex items-center gap-3 w-full">
      <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-300', barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={cn('text-xs font-mono font-semibold w-8 text-right flex-shrink-0', textColor)}>
        {stock}
      </span>
    </div>
  )
}
