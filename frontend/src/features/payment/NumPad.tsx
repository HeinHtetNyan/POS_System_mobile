import { cn } from '@/lib/utils'

interface NumPadProps {
  value: string
  onChange: (v: string) => void
}

const KEYS = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0', '⌫'] as const

export default function NumPad({ value, onChange }: NumPadProps) {
  function handleKey(key: string) {
    if (key === '⌫') {
      onChange(value.slice(0, -1))
      return
    }

    if (key === '.') {
      if (value.includes('.')) return
      onChange(value === '' ? '0.' : value + '.')
      return
    }

    // Enforce max 2 decimal places
    const dotIdx = value.indexOf('.')
    if (dotIdx !== -1 && value.length - dotIdx > 2) return

    onChange(value + key)
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {KEYS.map(key => (
        <button
          key={key}
          onClick={() => handleKey(key)}
          className={cn(
            'h-12 rounded-xl font-mono text-sm font-semibold transition-all duration-100 active:scale-95 select-none',
            key === '⌫'
              ? 'bg-zinc-800 text-zinc-400 hover:bg-red-950 hover:text-red-400 border border-zinc-700 hover:border-red-800'
              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 active:bg-zinc-900',
          )}
        >
          {key}
        </button>
      ))}
    </div>
  )
}
