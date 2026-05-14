import type { SyncOperation } from '@/types'
import { timeAgo } from '@/lib/utils'
import { useAppStore } from '@/store/appStore'
import { useSyncStore } from '@/store/syncStore'
import AppShell from '@/layouts/AppShell'
import { Badge, Btn, Spinner, StatCard } from '@/components/ui'
import { IconWifi, IconWifiOff, IconSync, IconCheck, IconAlert } from '@/components/icons'

const OP_LABELS: Record<SyncOperation['type'], string> = {
  SALE_CREATE:      'Sale Created',
  INVENTORY_UPDATE: 'Inventory Update',
  PRODUCT_UPDATE:   'Product Update',
  PAYMENT_PROCESS:  'Payment Processed',
}

export default function SyncScreen() {
  const { isOnline, toggleOnline, showToast } = useAppStore()
  const {
    syncQueue, syncStatus, lastSync,
    startSync, syncSuccess, syncError,
    retrySyncItem, dismissSyncItem,
  } = useSyncStore()

  const pending = syncQueue.filter(op => op.status === 'pending')
  const failed  = syncQueue.filter(op => op.status === 'failed')

  function handleSyncNow() {
    startSync()
    showToast({ message: 'Syncing…', type: 'info' })
    setTimeout(() => {
      syncSuccess()
      showToast({ message: 'Sync complete. All data up to date.', type: 'success' })
    }, 2000)
  }

  function handleRetry(id: string) {
    retrySyncItem(id)
    showToast({ message: 'Operation queued for retry.', type: 'info' })
  }

  function handleDismiss(id: string) {
    dismissSyncItem(id)
    showToast({ message: 'Operation dismissed.', type: 'warning' })
  }

  return (
    <AppShell title="Sync & Connectivity">
      <div className="p-6 flex flex-col gap-6 max-w-3xl">

        {/* 1. Connection status card */}
        <div className={`rounded-2xl border p-5 ${
          isOnline
            ? 'bg-green-950/40 border-green-800/60'
            : 'bg-red-950/40 border-red-800/60'
        }`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {isOnline ? (
                <div className="w-10 h-10 rounded-xl bg-green-900/60 flex items-center justify-center text-green-400">
                  <IconWifi width="20" height="20" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-red-900/60 flex items-center justify-center text-red-400">
                  <IconWifiOff width="20" height="20" />
                </div>
              )}
              <div>
                <p className={`text-sm font-semibold ${isOnline ? 'text-green-300' : 'text-red-300'}`}>
                  {isOnline ? 'Connected' : 'Offline Mode'}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {lastSync
                    ? `Last synced ${timeAgo(lastSync)}`
                    : 'All changes saved locally'}
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Btn
                variant="secondary"
                size="sm"
                onClick={toggleOnline}
              >
                {isOnline ? 'Simulate Offline' : 'Go Online'}
              </Btn>
              {isOnline && (
                <Btn
                  variant="primary"
                  size="sm"
                  onClick={handleSyncNow}
                  disabled={syncStatus === 'syncing'}
                >
                  {syncStatus === 'syncing' ? (
                    <><Spinner size={14} /> Syncing…</>
                  ) : (
                    <><IconSync width="14" height="14" /> Sync Now</>
                  )}
                </Btn>
              )}
            </div>
          </div>
        </div>

        {/* 2. Stats grid */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            label="Pending"
            value={pending.length}
            icon={<IconSync width="16" height="16" />}
          />
          <StatCard
            label="Failed"
            value={failed.length}
            icon={<IconAlert width="16" height="16" />}
          />
          <StatCard
            label="Total Queue"
            value={syncQueue.length}
            icon={<IconSync width="16" height="16" />}
          />
        </div>

        {/* 3. Failed operations */}
        {failed.length > 0 && (
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Failed Operations
            </h3>
            {failed.map(op => (
              <div
                key={op.id}
                className="bg-red-950/30 border border-red-800/50 rounded-xl px-4 py-3 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-red-900/60 flex items-center justify-center text-red-400 flex-shrink-0">
                    <IconAlert width="14" height="14" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-red-300">{OP_LABELS[op.type]}</p>
                    <p className="text-xs text-zinc-500">
                      {timeAgo(op.createdAt)} · {op.retries} {op.retries === 1 ? 'retry' : 'retries'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Btn variant="secondary" size="xs" onClick={() => handleRetry(op.id)}>
                    Retry
                  </Btn>
                  <Btn variant="ghost" size="xs" onClick={() => handleDismiss(op.id)}>
                    Dismiss
                  </Btn>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 4. Pending operations */}
        {pending.length > 0 && (
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Pending Operations
            </h3>
            {pending.map(op => (
              <div
                key={op.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative flex-shrink-0">
                    <span className="w-2 h-2 rounded-full bg-amber-500 block animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-200">{OP_LABELS[op.type]}</p>
                    <p className="text-xs text-zinc-500">{timeAgo(op.createdAt)}</p>
                  </div>
                </div>
                <Badge variant="warning" size="xs">Pending</Badge>
              </div>
            ))}
          </div>
        )}

        {/* 5. All caught up empty state */}
        {syncQueue.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center bg-zinc-900 border border-zinc-800 rounded-2xl">
            <div className="w-12 h-12 rounded-2xl bg-green-900/40 flex items-center justify-center text-green-400 mb-3">
              <IconCheck width="24" height="24" />
            </div>
            <p className="text-zinc-300 font-medium text-sm">All caught up</p>
            <p className="text-zinc-600 text-xs mt-1">No pending or failed sync operations</p>
          </div>
        )}

        {/* 6. Sync configuration info card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
            Sync Configuration
          </h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            {[
              { label: 'Auto-sync Interval', value: 'Every 30 seconds' },
              { label: 'Retry Strategy',     value: 'Exponential backoff' },
              { label: 'Offline Storage',    value: 'IndexedDB (local)' },
              { label: 'Conflict Resolution',value: 'Server wins' },
            ].map(item => (
              <div key={item.label}>
                <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider">{item.label}</p>
                <p className="text-xs text-zinc-300 mt-0.5">{item.value}</p>
              </div>
            ))}
            <div className="col-span-2">
              <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider">Device ID</p>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">nexuspos-device-{
                typeof window !== 'undefined'
                  ? btoa(navigator.userAgent).slice(0, 12)
                  : 'local-001'
              }</p>
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  )
}
