import type { ReactNode } from 'react'
import { useAppStore } from '@/store/appStore'
import { IconMenu, IconSearch, IconWifi, IconWifiOff } from '@/components/icons'
import { cn } from '@/lib/utils'
import SyncBadge from '@/layouts/SyncBadge'

interface TopBarProps {
  title?: string
  action?: ReactNode
  search?: string
  onSearchChange?: (q: string) => void
}

export default function TopBar({ title, action, search, onSearchChange }: TopBarProps) {
  const { toggleSidebar, isOnline, toggleOnline } = useAppStore()

  return (
    <header className="flex items-center gap-3 px-4 h-14 bg-zinc-950 border-b border-zinc-800 flex-shrink-0">
      {/* Hamburger (mobile) */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors flex-shrink-0"
        aria-label="Open menu"
      >
        <IconMenu width="18" height="18" />
      </button>

      {/* Title */}
      {title && (
        <h1 className="hidden sm:block text-sm font-semibold text-zinc-100 flex-shrink-0">{title}</h1>
      )}

      {/* Search */}
      {onSearchChange !== undefined && (
        <div className="relative flex items-center flex-1 max-w-sm">
          <span className="absolute left-3 text-zinc-500 pointer-events-none flex items-center">
            <IconSearch width="15" height="15" />
          </span>
          <input
            type="text"
            value={search ?? ''}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search…"
            className={cn(
              'w-full bg-zinc-900 border border-zinc-800 rounded-xl',
              'pl-9 pr-3 py-2 text-sm text-zinc-100 placeholder-zinc-600',
              'focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all',
            )}
          />
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Action slot */}
      {action && <div className="flex items-center gap-2 flex-shrink-0">{action}</div>}

      {/* Sync badge */}
      <div className="flex-shrink-0">
        <SyncBadge />
      </div>

      {/* Online toggle */}
      <button
        onClick={toggleOnline}
        title={isOnline ? 'Go offline' : 'Go online'}
        className={cn(
          'w-9 h-9 flex items-center justify-center rounded-xl transition-colors flex-shrink-0',
          isOnline
            ? 'text-green-400 hover:bg-green-950 hover:text-green-300'
            : 'text-red-400 hover:bg-red-950 hover:text-red-300',
        )}
      >
        {isOnline
          ? <IconWifi width="16" height="16" />
          : <IconWifiOff width="16" height="16" />
        }
      </button>
    </header>
  )
}
