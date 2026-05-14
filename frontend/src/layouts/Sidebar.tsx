import { useAppStore } from '@/store/appStore'
import { canAccess, ROLE_LABELS, ROLE_BADGE_STYLES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { IconX, IconPOS, IconProducts, IconInventory, IconSales, IconSync, IconLogout } from '@/components/icons'
import type { AppScreen } from '@/types'

interface NavItem {
  id: AppScreen
  label: string
  icon: React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  { id: 'pos',       label: 'Checkout',  icon: <IconPOS width="18" height="18" /> },
  { id: 'products',  label: 'Products',  icon: <IconProducts width="18" height="18" /> },
  { id: 'inventory', label: 'Inventory', icon: <IconInventory width="18" height="18" /> },
  { id: 'sales',     label: 'Sales',     icon: <IconSales width="18" height="18" /> },
  { id: 'sync',      label: 'Sync',      icon: <IconSync width="18" height="18" /> },
]

function SidebarContent({
  onNavClick,
}: {
  onNavClick?: () => void
}) {
  const { user, session, screen, setScreen } = useAppStore()

  if (!user) return null

  const roleStyle = ROLE_BADGE_STYLES[user.role]
  const filtered  = NAV_ITEMS.filter(item => canAccess(user.role, item.id))

  function handleNav(id: AppScreen) {
    setScreen(id)
    onNavClick?.()
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-r border-zinc-800">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-zinc-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-black font-black text-lg flex-shrink-0 shadow-lg shadow-amber-900/40">
            N
          </div>
          <div>
            <p className="font-bold text-zinc-100 text-sm leading-tight">NexusPOS</p>
            <p className="text-zinc-500 text-[10px] leading-tight tracking-wider uppercase">Enterprise</p>
          </div>
        </div>

        {/* Session indicator */}
        {session && (
          <div className="mt-3 flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-green-950 border border-green-900">
            <span className="relative flex h-2 w-2 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <div className="min-w-0">
              <p className="text-green-400 text-[10px] font-medium leading-tight">Session Open</p>
              <p className="text-green-600 text-[10px] font-mono leading-tight truncate">{session.id}</p>
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filtered.map(item => {
          const active = screen === item.id
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-left',
                active
                  ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 border border-transparent',
              )}
            >
              <span className={cn('flex-shrink-0', active ? 'text-amber-400' : 'text-zinc-500')}>
                {item.icon}
              </span>
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 pt-3 border-t border-zinc-800 flex-shrink-0 space-y-3">
        {/* User avatar + info */}
        <div className="flex items-center gap-3 px-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 border"
            style={{ background: roleStyle.bg, color: roleStyle.text, borderColor: roleStyle.border }}
          >
            {user.initials}
          </div>
          <div className="min-w-0">
            <p className="text-zinc-100 text-sm font-medium truncate leading-tight">{user.name}</p>
            <p className="text-zinc-500 text-xs leading-tight">{ROLE_LABELS[user.role]}</p>
          </div>
        </div>

        {/* Close session */}
        <button
          onClick={() => { setScreen('session-close'); onNavClick?.() }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-zinc-500 hover:text-red-400 hover:bg-red-950 border border-transparent hover:border-red-900 transition-all duration-150"
        >
          <IconLogout width="14" height="14" />
          Close Session
        </button>
      </div>
    </div>
  )
}

export default function Sidebar() {
  const { sidebarOpen, closeSidebar } = useAppStore()

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-56 flex-shrink-0 flex-col h-full">
        <SidebarContent />
      </aside>

      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          onClick={closeSidebar}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'lg:hidden fixed top-0 left-0 h-full w-64 z-50 flex flex-col shadow-2xl',
          'transition-transform duration-300 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Mobile close header */}
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-950 border-b border-zinc-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center text-black font-black text-sm">
              N
            </div>
            <span className="font-bold text-zinc-100 text-sm">NexusPOS</span>
          </div>
          <button
            onClick={closeSidebar}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <IconX width="16" height="16" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          <SidebarContent onNavClick={closeSidebar} />
        </div>
      </aside>
    </>
  )
}
