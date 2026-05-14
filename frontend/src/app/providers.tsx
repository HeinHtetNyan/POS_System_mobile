import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { type ReactNode, useEffect } from 'react'
import { queryClient } from '@/lib/queryClient'
import { useAppStore } from '@/store/appStore'
import { db, seedProducts, seedCategories } from '@/offline/db'
import { PRODUCTS_DATA, CATEGORIES_DATA } from '@/lib/constants'

function OnlineDetector() {
  const setOnline = useAppStore(s => s.setOnline)
  const showToast = useAppStore(s => s.showToast)

  useEffect(() => {
    const onOnline = () => {
      setOnline(true)
      showToast({ message: 'Connection restored — syncing', type: 'success' })
    }
    const onOffline = () => {
      setOnline(false)
      showToast({ message: 'Working offline', type: 'warning' })
    }
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [setOnline, showToast])

  return null
}

function DBSeeder() {
  useEffect(() => {
    seedProducts(PRODUCTS_DATA).catch(console.error)
    seedCategories(CATEGORIES_DATA).catch(console.error)
  }, [])
  return null
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <OnlineDetector />
      <DBSeeder />
      {children}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}
