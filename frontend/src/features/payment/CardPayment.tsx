import { useState, useEffect, useRef } from 'react'
import { fmt } from '@/lib/utils'
import { IconCard } from '@/components/icons'
import { Spinner } from '@/components/ui'

interface CardPaymentProps {
  total: number
  onProcess: () => void
}

export default function CardPayment({ total, onProcess }: CardPaymentProps) {
  const [processing, setProcessing] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current)
    }
  }, [])

  function handleCharge() {
    setProcessing(true)
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      onProcess()
    }, 1500)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Total display */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-center">
        <p className="text-xs text-zinc-600 uppercase tracking-wider mb-1">Charge Amount</p>
        <p className="font-mono text-4xl font-bold text-zinc-100">{fmt(total)}</p>
      </div>

      {/* Card terminal illustration */}
      <div className="flex flex-col items-center justify-center gap-4 py-8 px-6 bg-zinc-900/50 border border-zinc-800 rounded-xl border-dashed">
        {processing ? (
          <>
            <Spinner size={40} />
            <p className="text-sm font-medium text-zinc-400 animate-pulse">Processing…</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-2xl bg-blue-950 border border-blue-800 flex items-center justify-center">
              <IconCard width="32" height="32" className="text-blue-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-zinc-200">Present card to terminal</p>
              <p className="text-xs text-zinc-600 mt-0.5">Tap, insert, or swipe</p>
            </div>
          </>
        )}
      </div>

      {/* Charge button */}
      <button
        onClick={handleCharge}
        disabled={processing}
        className={`
          w-full h-12 rounded-xl font-bold text-base transition-all duration-150 active:scale-[0.98]
          ${processing
            ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-700'
            : 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white shadow-lg shadow-blue-900/30'
          }
        `}
      >
        {processing ? 'Processing…' : `Charge Card ${fmt(total)}`}
      </button>
    </div>
  )
}
