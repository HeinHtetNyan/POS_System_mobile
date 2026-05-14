import { useAppStore } from '@/store/appStore'
import { IconWifiOff } from '@/components/icons'

export default function OfflineBanner() {
  const isOnline = useAppStore(s => s.isOnline)

  if (isOnline) return null

  return (
    <div className="flex items-center justify-center gap-2.5 px-4 py-2.5 bg-amber-950 border-b border-amber-800 text-amber-300 text-xs font-medium">
      <IconWifiOff width="14" height="14" className="flex-shrink-0" />
      <span>Working offline — all sales will sync when connection is restored</span>
    </div>
  )
}
