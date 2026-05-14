import { useSyncStore } from '@/store/syncStore'
import { useAppStore } from '@/store/appStore'
import { Spinner } from '@/components/ui/index'
import { IconWifi, IconWifiOff, IconSync, IconAlert } from '@/components/icons'
import { timeAgo } from '@/lib/utils'
import { cn } from '@/lib/utils'

export default function SyncBadge() {
  const { syncQueue, syncStatus, lastSync, startSync, syncSuccess, syncError } = useSyncStore()
  const { isOnline, setScreen, showToast } = useAppStore()

  const pending = syncQueue.filter(op => op.status === 'pending').length
  const failed  = syncQueue.filter(op => op.status === 'failed').length

  function handleSync() {
    startSync()
    setTimeout(() => {
      if (Math.random() < 0.85) {
        syncSuccess()
        showToast({ message: 'Sync completed successfully', type: 'success' })
      } else {
        syncError()
        showToast({ message: 'Sync failed — will retry shortly', type: 'error' })
      }
    }, 2000)
  }

  // ── Offline ────────────────────────────────────────────────────────────────
  if (!isOnline) {
    return (
      <button
        onClick={() => setScreen('sync')}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950 border border-red-800 text-red-400 text-xs font-medium hover:bg-red-900 transition-colors"
      >
        <IconWifiOff width="13" height="13" />
        <span>Offline</span>
        {pending > 0 && (
          <span className="ml-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
            {pending}
          </span>
        )}
      </button>
    )
  }

  // ── Syncing ────────────────────────────────────────────────────────────────
  if (syncStatus === 'syncing') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-950 border border-blue-800 text-blue-400 text-xs font-medium">
        <Spinner size={13} />
        <span>Syncing…</span>
      </span>
    )
  }

  // ── Failed ─────────────────────────────────────────────────────────────────
  if (failed > 0) {
    return (
      <button
        onClick={() => setScreen('sync')}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950 border border-red-800 text-red-400 text-xs font-medium hover:bg-red-900 transition-colors"
      >
        <IconAlert width="13" height="13" />
        <span>{failed} failed</span>
      </button>
    )
  }

  // ── Pending ────────────────────────────────────────────────────────────────
  if (pending > 0) {
    return (
      <button
        onClick={handleSync}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950 border border-amber-800 text-amber-400 text-xs font-medium hover:bg-amber-900 transition-colors"
      >
        <IconSync width="13" height="13" />
        <span>{pending} pending</span>
      </button>
    )
  }

  // ── Default (synced) ───────────────────────────────────────────────────────
  return (
    <button
      onClick={handleSync}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg',
        'bg-green-950 border border-green-800 text-green-400 text-xs font-medium',
        'hover:bg-green-900 transition-colors',
      )}
    >
      <IconWifi width="13" height="13" />
      <span>{lastSync ? timeAgo(lastSync) : 'never'}</span>
    </button>
  )
}
