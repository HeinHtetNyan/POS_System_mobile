import type { ReactNode } from 'react'
import { useAppStore } from '@/store/appStore'
import Sidebar from '@/layouts/Sidebar'
import TopBar from '@/layouts/TopBar'
import OfflineBanner from '@/layouts/OfflineBanner'

interface AppShellProps {
  title?: string
  action?: ReactNode
  search?: string
  onSearchChange?: (q: string) => void
  children: ReactNode
}

export default function AppShell({ title, action, search, onSearchChange, children }: AppShellProps) {
  const { sidebarOpen, closeSidebar } = useAppStore()

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      {/* Sidebar (desktop fixed + mobile overlay) */}
      <Sidebar />

      {/* Mobile backdrop (rendered by Sidebar, but close handler here too) */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40"
          onClick={closeSidebar}
        />
      )}

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Offline banner */}
        <OfflineBanner />

        {/* TopBar */}
        <TopBar
          title={title}
          action={action}
          search={search}
          onSearchChange={onSearchChange}
        />

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
