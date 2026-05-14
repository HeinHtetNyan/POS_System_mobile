import { useState } from 'react'
import type { SplitPayment as SplitPaymentType } from '@/types'
import { fmt } from '@/lib/utils'
import { IconCash, IconCard, IconX, IconPlus } from '@/components/icons'
import { cn } from '@/lib/utils'

interface SplitPaymentProps {
  total: number
  splitPayments: SplitPaymentType[]
  onAdd: (p: SplitPaymentType) => void
  onRemove: (i: number) => void
  onProcess: () => void
}

export default function SplitPayment({ total, splitPayments, onAdd, onRemove, onProcess }: SplitPaymentProps) {
  const [addMethod, setAddMethod] = useState<'cash' | 'card'>('cash')
  const [addAmount, setAddAmount] = useState('')

  const paid = splitPayments.reduce((s, p) => s + p.amount, 0)
  const remaining = Math.max(0, total - paid)
  const progressPct = total > 0 ? Math.min(100, (paid / total) * 100) : 0
  const fullyCovered = paid >= total

  function handleAdd() {
    const val = parseFloat(addAmount)
    if (isNaN(val) || val <= 0) return
    onAdd({ method: addMethod, amount: val })
    setAddAmount('')
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Progress panel */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2">
        <div className="flex justify-between text-xs text-zinc-500">
          <span>Total</span>
          <span className="font-mono text-zinc-100 font-semibold">{fmt(total)}</span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-green-400 font-mono">{fmt(paid)} paid</span>
          <span className={cn('font-mono font-semibold', remaining > 0 ? 'text-red-400' : 'text-green-400')}>
            {remaining > 0 ? `${fmt(remaining)} left` : 'Fully covered'}
          </span>
        </div>
      </div>

      {/* Added payments list */}
      {splitPayments.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {splitPayments.map((p, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl">
              <span className="text-zinc-500">
                {p.method === 'cash'
                  ? <IconCash width="14" height="14" />
                  : <IconCard width="14" height="14" />
                }
              </span>
              <span className="capitalize text-xs text-zinc-400">{p.method}</span>
              <span className="flex-1 text-right font-mono text-sm font-semibold text-zinc-100">
                {fmt(p.amount)}
              </span>
              <button
                onClick={() => onRemove(i)}
                className="w-5 h-5 rounded flex items-center justify-center text-zinc-600 hover:text-red-400 hover:bg-red-950/50 transition-colors"
              >
                <IconX width="11" height="11" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add payment row */}
      {!fullyCovered && (
        <div className="flex flex-col gap-2 p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl">
          {/* Cash / Card toggle */}
          <div className="flex gap-1.5">
            {(['cash', 'card'] as const).map(m => (
              <button
                key={m}
                onClick={() => setAddMethod(m)}
                className={cn(
                  'flex-1 h-9 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border',
                  addMethod === m
                    ? 'bg-zinc-700 border-zinc-500 text-zinc-100'
                    : 'bg-zinc-800 border-zinc-800 text-zinc-500 hover:text-zinc-300',
                )}
              >
                {m === 'cash' ? <IconCash width="13" height="13" /> : <IconCard width="13" height="13" />}
                <span className="capitalize">{m}</span>
              </button>
            ))}
          </div>

          {/* Amount input + Add button */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600 text-sm pointer-events-none">$</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={addAmount}
                onChange={e => setAddAmount(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                placeholder={fmt(remaining).replace('$', '')}
                className={cn(
                  'w-full bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-100 font-mono text-sm',
                  'focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all',
                  'py-2 pl-6 pr-3',
                )}
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={!addAmount || parseFloat(addAmount) <= 0}
              className="h-10 px-4 rounded-xl bg-zinc-700 hover:bg-zinc-600 border border-zinc-600 text-zinc-100 text-sm font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <IconPlus width="13" height="13" />
              Add
            </button>
          </div>
        </div>
      )}

      {/* Process button */}
      <button
        onClick={onProcess}
        disabled={!fullyCovered}
        className={`
          w-full h-12 rounded-xl font-bold text-base transition-all duration-150 active:scale-[0.98]
          ${fullyCovered
            ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-900/30'
            : 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-700'
          }
        `}
      >
        {fullyCovered ? `Process Split Payment` : `${fmt(remaining)} remaining`}
      </button>
    </div>
  )
}
