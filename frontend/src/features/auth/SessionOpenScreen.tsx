import { useState } from 'react'
import { useAppStore } from '@/store/appStore'
import { ROLE_LABELS, ROLE_BADGE_STYLES } from '@/lib/constants'
import { fmtDate, fmt } from '@/lib/utils'
import { Btn, Spinner } from '@/components/ui/index'
import { IconCash } from '@/components/icons'

const QUICK_FLOATS = [50, 100, 200, 300, 500]

export default function SessionOpenScreen() {
  const { user, setSession, setScreen, showToast, logout } = useAppStore()
  const [balance, setBalance] = useState('200.00')
  const [loading, setLoading] = useState(false)

  if (!user) return null

  const roleStyle  = ROLE_BADGE_STYLES[user.role]
  const numBalance = parseFloat(balance) || 0

  function handleOpen() {
    const currentUser = user
    if (!currentUser) return
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSession({
        id: `SES-${Date.now()}`,
        openingBalance: numBalance,
        startTime: new Date(),
        status: 'open',
        cashier: currentUser,
      })
      setScreen('pos')
      showToast({ message: 'Session opened successfully', type: 'success' })
    }, 700)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ backgroundColor: '#09090B' }}
    >
      {/* Grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(217,119,6,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(217,119,6,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 mb-4">
            <IconCash width="28" height="28" />
          </div>
          <h1 className="text-xl font-bold text-zinc-100">Open Cash Register</h1>
          <p className="text-zinc-500 text-sm mt-1">Enter your opening float to begin the session</p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-5">
          {/* User info */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold border flex-shrink-0"
              style={{ background: roleStyle.bg, color: roleStyle.text, borderColor: roleStyle.border }}
            >
              {user.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-zinc-100 text-sm font-semibold leading-tight">{user.name}</p>
              <p className="text-zinc-500 text-xs leading-tight">{ROLE_LABELS[user.role]}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-zinc-500 text-xs">{fmtDate(new Date())}</p>
            </div>
          </div>

          {/* Opening balance */}
          <div>
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider block mb-2">
              Opening Balance
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-amber-500 text-lg font-bold pointer-events-none">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={balance}
                onChange={e => setBalance(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl text-zinc-100 text-right font-mono text-2xl font-bold
                  focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all
                  pl-10 pr-4 py-4"
              />
            </div>
          </div>

          {/* Quick float buttons */}
          <div>
            <p className="text-xs text-zinc-600 mb-2 uppercase tracking-wider font-medium">Quick Float</p>
            <div className="flex gap-2">
              {QUICK_FLOATS.map(amount => {
                const active = numBalance === amount
                return (
                  <button
                    key={amount}
                    onClick={() => setBalance(amount.toFixed(2))}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-150 border ${
                      active
                        ? 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-900/30'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700 hover:text-zinc-100'
                    }`}
                  >
                    {fmt(amount)}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Open session */}
          <Btn
            variant="primary"
            size="xl"
            fullWidth
            onClick={handleOpen}
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner size={18} />
                Opening Session…
              </>
            ) : (
              <>
                <IconCash width="18" height="18" />
                Open Session
              </>
            )}
          </Btn>
        </div>

        {/* Back link */}
        <div className="text-center mt-5">
          <button
            onClick={logout}
            className="text-zinc-600 hover:text-zinc-400 text-sm transition-colors"
          >
            ← Back to login
          </button>
        </div>
      </div>
    </div>
  )
}
