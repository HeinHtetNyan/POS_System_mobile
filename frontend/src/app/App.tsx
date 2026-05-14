import { useEffect } from 'react'
import { useAppStore } from '@/store/appStore'
import { useCartStore } from '@/store/cartStore'
import { ToastNotification } from '@/components/ui'
import Sidebar from '@/layouts/Sidebar'
import OfflineBanner from '@/layouts/OfflineBanner'
import POSScreen from '@/features/pos/POSScreen'
import ProductsScreen from '@/features/products/ProductsScreen'
import InventoryScreen from '@/features/inventory/InventoryScreen'
import SalesScreen from '@/features/sales/SalesScreen'
import SyncScreen from '@/features/sync/SyncScreen'
import LoginScreen from '@/features/auth/LoginScreen'
import SessionOpenScreen from '@/features/auth/SessionOpenScreen'
import SessionCloseScreen from '@/features/auth/SessionCloseScreen'
import { IconMenu, IconWifi, IconWifiOff, IconLogout } from '@/components/icons'
import SyncBadge from '@/layouts/SyncBadge'

function POSShellInner() {
  const { screen, session, sidebarOpen, isOnline, toggleSidebar, toggleOnline, setScreen } = useAppStore()

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="flex items-center gap-3 px-4 py-2.5 border-b border-zinc-800 bg-zinc-950 flex-shrink-0">
        <button
          onClick={toggleSidebar}
          className="lg:hidden text-zinc-500 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
        >
          <IconMenu width="16" height="16" />
        </button>
        <div className="hidden sm:flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-amber-500 flex items-center justify-center flex-shrink-0">
            <span className="text-black font-black text-xs">N</span>
          </div>
          <span className="text-xs font-semibold text-zinc-400">Checkout</span>
        </div>
        {session && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-zinc-900 rounded-lg border border-zinc-800">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-zinc-400 font-mono">{session.id}</span>
          </div>
        )}
        <div className="flex-1" />
        <SyncBadge />
        <button
          onClick={toggleOnline}
          title={isOnline ? 'Simulate offline' : 'Go online'}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isOnline ? 'text-zinc-600 hover:bg-zinc-800' : 'text-red-500 bg-red-950/40'}`}
        >
          {isOnline ? <IconWifi width="14" height="14" /> : <IconWifiOff width="14" height="14" />}
        </button>
        <button
          onClick={() => setScreen('session-close')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-500 hover:text-red-400 rounded-lg hover:bg-red-950/30 transition-all border border-transparent hover:border-red-900/40"
        >
          <IconLogout width="13" height="13" />
          <span className="hidden sm:inline">Close Session</span>
        </button>
      </header>
      <main className="flex-1 overflow-hidden">
        <POSScreen />
      </main>
    </div>
  )
}

function POSShell() {
  const { screen, sidebarOpen, closeSidebar } = useAppStore()

  return (
    <div className="h-full flex overflow-hidden">
      <Sidebar />
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-20"
          onClick={closeSidebar}
        />
      )}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <OfflineBanner />
        {screen === 'pos'       && <POSShellInner />}
        {screen === 'products'  && <ProductsScreen />}
        {screen === 'inventory' && <InventoryScreen />}
        {screen === 'sales'     && <SalesScreen />}
        {screen === 'sync'      && <SyncScreen />}
      </div>
    </div>
  )
}

export function App() {
  const { screen, toast, hideToast } = useAppStore()
  const { checkoutStep } = useCartStore()

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const t = setTimeout(hideToast, 3200)
      return () => clearTimeout(t)
    }
  }, [toast, hideToast])

  const renderScreen = () => {
    if (screen === 'login')         return <LoginScreen />
    if (screen === 'session-open')  return <SessionOpenScreen />
    if (screen === 'session-close') return <SessionCloseScreen />
    return <POSShell />
  }

  return (
    <div style={{ height: '100%', fontFamily: "'Outfit', sans-serif" }}>
      {renderScreen()}
      <ToastNotification toast={toast} />
    </div>
  )
}
