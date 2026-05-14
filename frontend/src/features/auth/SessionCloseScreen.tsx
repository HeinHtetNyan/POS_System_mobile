import { useState } from 'react'
import { useAppStore } from '@/store/appStore'
import { useSalesStore } from '@/store/salesStore'
import { ROLE_LABELS, ROLE_BADGE_STYLES } from '@/lib/constants'
import { fmt, fmtDateTime } from '@/lib/utils'
import { Btn, Divider, Spinner } from '@/components/ui/index'
import { IconLogout, IconCash, IconCard, IconAlert } from '@/components/icons'

export default function SessionCloseScreen() {
  const { user, session, setSession, setUser, setScreen, showToast } = useAppStore()
  const { sales } = useSalesStore()

  const [actualCash, setActualCash] = useState('')
  const [loading, setLoading]       = useState(false)

  if (!session || !user) return null

  const roleStyle = ROLE_BADGE_STYLES[user.role]

  // Filter sales that belong to this session (date >= startTime)
  const sessionStart = new Date(session.startTime).getTime()
  const sessionSales = sales.filter(s => new Date(s.date).getTime() >= sessionStart)

  const totalRevenue  = sessionSales.reduce((acc, s) => acc + s.total, 0)
  const cashSalesAmt  = sessionSales
    .filter(s => s.paymentMethod === 'cash')
    .reduce((acc, s) => acc + s.total, 0)
  const cardSalesAmt  = sessionSales
    .filter(s => s.paymentMethod === 'card')
    .reduce((acc, s) => acc + s.total, 0)

  const expectedCash  = session.openingBalance + cashSalesAmt
  const actual        = parseFloat(actualCash) || 0
  const discrepancy   = actualCash !== '' ? actual - expectedCash : null

  function getDiscrepancyColor() {
    if (discrepancy === null) return 'bg-zinc-900 border-zinc-800 text-zinc-400'
    if (Math.abs(discrepancy) < 0.01) return 'bg-green-950 border-green-800 text-green-400'
    if (discrepancy < 0) return 'bg-red-950 border-red-800 text-red-400'
    return 'bg-amber-950 border-amber-800 text-amber-400'
  }

  function getDiscrepancyLabel() {
    if (discrepancy === null) return 'Enter actual cash to see discrepancy'
    if (Math.abs(discrepancy) < 0.01) return 'Cash balanced — no discrepancy'
    if (discrepancy < 0) return `Short by ${fmt(Math.abs(discrepancy))}`
    return `Over by ${fmt(discrepancy)}`
  }

  function handleClose() {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSession(null)
      setUser(null)
      setScreen('login')
      showToast({ message: 'Session closed successfully', type: 'success' })
    }, 800)
  }

  return (
    <div className="min-h-screen overflow-y-auto bg-zinc-950 flex items-start justify-center p-4 py-8">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-950 border border-red-800 text-red-400 mb-4">
            <IconLogout width="26" height="26" />
          </div>
          <h1 className="text-xl font-bold text-zinc-100">Close Session</h1>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="font-mono text-amber-400 text-sm">{session.id}</span>
            <span className="text-zinc-600 text-xs">·</span>
            <span className="text-zinc-500 text-xs">Started {fmtDateTime(session.startTime)}</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Cashier strip */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-800 bg-zinc-950">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold border flex-shrink-0"
              style={{ background: roleStyle.bg, color: roleStyle.text, borderColor: roleStyle.border }}
            >
              {user.initials}
            </div>
            <div>
              <p className="text-zinc-100 text-sm font-semibold leading-tight">{user.name}</p>
              <p className="text-zinc-500 text-xs">{ROLE_LABELS[user.role]}</p>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* 3-col stat grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-center">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Orders</p>
                <p className="text-2xl font-bold font-mono text-zinc-100">{sessionSales.length}</p>
              </div>
              <div className="rounded-xl border border-amber-800/40 bg-amber-500/5 p-3 text-center">
                <p className="text-xs text-amber-600 uppercase tracking-wider mb-1">Revenue</p>
                <p className="text-2xl font-bold font-mono text-amber-400">{fmt(totalRevenue)}</p>
              </div>
              <div className="rounded-xl border border-blue-800/40 bg-blue-500/5 p-3 text-center">
                <p className="text-xs text-blue-600 uppercase tracking-wider mb-1">Card</p>
                <p className="text-2xl font-bold font-mono text-blue-400">{fmt(cardSalesAmt)}</p>
              </div>
            </div>

            <Divider />

            {/* Cash reconciliation */}
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Cash Reconciliation</p>
              <div className="space-y-2">
                {/* Opening float */}
                <div className="flex items-center justify-between py-2 border-b border-zinc-800">
                  <div className="flex items-center gap-2 text-zinc-400 text-sm">
                    <IconCash width="15" height="15" className="text-zinc-600" />
                    Opening Float
                  </div>
                  <span className="font-mono text-zinc-200 text-sm">{fmt(session.openingBalance)}</span>
                </div>
                {/* Cash sales */}
                <div className="flex items-center justify-between py-2 border-b border-zinc-800">
                  <div className="flex items-center gap-2 text-zinc-400 text-sm">
                    <IconCash width="15" height="15" className="text-zinc-600" />
                    Cash Sales
                  </div>
                  <span className="font-mono text-zinc-200 text-sm">{fmt(cashSalesAmt)}</span>
                </div>
                {/* Expected cash */}
                <div className="flex items-center justify-between py-2 border-b border-zinc-800">
                  <div className="flex items-center gap-2 text-zinc-300 text-sm font-medium">
                    <IconCard width="15" height="15" className="text-zinc-500" />
                    Expected in Drawer
                  </div>
                  <span className="font-mono text-zinc-100 text-sm font-semibold">{fmt(expectedCash)}</span>
                </div>
              </div>
            </div>

            {/* Actual cash input */}
            <div>
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider block mb-2">
                Actual Cash in Drawer
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-amber-500 text-base font-bold pointer-events-none">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={actualCash}
                  onChange={e => setActualCash(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl text-zinc-100 text-right font-mono text-xl font-bold
                    focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all
                    pl-10 pr-4 py-3"
                />
              </div>
            </div>

            {/* Discrepancy */}
            <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium ${getDiscrepancyColor()}`}>
              <IconAlert width="15" height="15" className="flex-shrink-0" />
              <span>{getDiscrepancyLabel()}</span>
              {discrepancy !== null && Math.abs(discrepancy) >= 0.01 && (
                <span className="ml-auto font-mono font-bold">{fmt(Math.abs(discrepancy))}</span>
              )}
            </div>

            <Divider />

            {/* Actions */}
            <div className="flex gap-3">
              <Btn
                variant="secondary"
                size="lg"
                className="flex-1"
                onClick={() => setScreen('pos')}
                disabled={loading}
              >
                Cancel
              </Btn>
              <Btn
                variant="danger"
                size="lg"
                className="flex-1"
                onClick={handleClose}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner size={16} />
                    Closing…
                  </>
                ) : (
                  <>
                    <IconLogout width="16" height="16" />
                    Close Session
                  </>
                )}
              </Btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
