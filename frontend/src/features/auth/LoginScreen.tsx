import { useState } from 'react'
import { useAppStore } from '@/store/appStore'
import { USERS_DATA, ROLE_LABELS, ROLE_BADGE_STYLES } from '@/lib/constants'
import { fmtDate } from '@/lib/utils'
import { Btn, Input, Spinner, Divider } from '@/components/ui/index'
import { IconAlert } from '@/components/icons'
import type { User } from '@/types'

export default function LoginScreen() {
  const { setUser, setScreen } = useAppStore()

  const [email, setEmail]               = useState('alex@nexuspos.io')
  const [password, setPassword]         = useState('••••••••')
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string>('u001')

  function selectUser(u: User) {
    setSelectedUserId(u.id)
    setEmail(u.email)
    setError('')
  }

  function handleSignIn() {
    setError('')
    const found = USERS_DATA.find(u => u.email.toLowerCase() === email.toLowerCase().trim())
    if (!found) {
      setError('No account found with that email address.')
      return
    }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setUser(found)
      setScreen('session-open')
    }, 800)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ backgroundColor: '#09090B' }}
    >
      {/* Grid pattern background */}
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
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500 shadow-2xl shadow-amber-900/50 mb-4">
            <span className="text-black font-black text-3xl">N</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100">NexusPOS</h1>
          <p className="text-zinc-500 text-sm mt-1">Enterprise Point of Sale</p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
          {/* Quick login */}
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Quick Login</p>
          <div className="grid grid-cols-2 gap-2 mb-5">
            {USERS_DATA.map(u => {
              const style   = ROLE_BADGE_STYLES[u.role]
              const isActive = selectedUserId === u.id
              return (
                <button
                  key={u.id}
                  onClick={() => selectUser(u)}
                  className={`text-left p-3 rounded-xl border transition-all duration-150 ${
                    isActive
                      ? 'border-amber-500/50 bg-amber-500/10'
                      : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-800'
                  }`}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold border mb-1.5"
                    style={{ background: style.bg, color: style.text, borderColor: style.border }}
                  >
                    {u.initials}
                  </div>
                  <p className="text-zinc-100 text-xs font-semibold leading-tight truncate">{u.name}</p>
                  <p
                    className="text-[10px] leading-tight mt-0.5 font-medium"
                    style={{ color: style.text }}
                  >
                    {ROLE_LABELS[u.role]}
                  </p>
                </button>
              )
            })}
          </div>

          <Divider label="or enter credentials" />

          <div className="space-y-3 mt-4">
            {/* Email */}
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              placeholder="you@nexuspos.io"
              autoComplete="email"
            />

            {/* Password */}
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
            />

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-950 border border-red-800 text-red-400 text-xs">
                <IconAlert width="14" height="14" className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Sign In */}
            <Btn
              variant="primary"
              size="xl"
              fullWidth
              onClick={handleSignIn}
              disabled={loading}
              className="mt-1"
            >
              {loading ? (
                <>
                  <Spinner size={18} />
                  Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </Btn>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-zinc-600 text-[11px] mt-6">
          NexusPOS v5.0 · Main Branch · {fmtDate(new Date())}
        </p>
      </div>
    </div>
  )
}
