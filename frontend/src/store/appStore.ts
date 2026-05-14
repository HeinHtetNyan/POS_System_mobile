import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Session, AppScreen, Toast } from '@/types'

interface AppState {
  // Auth
  user: User | null
  session: Session | null
  screen: AppScreen

  // UI
  sidebarOpen: boolean
  toast: Toast | null

  // Connectivity
  isOnline: boolean

  // Product UI state
  productSearch: string
  activeCategory: string
  activeOrderId: string | null
  productEditId: string | null
  adjustingProductId: string | null

  // Actions
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setScreen: (screen: AppScreen) => void
  toggleSidebar: () => void
  closeSidebar: () => void
  showToast: (toast: Toast) => void
  hideToast: () => void
  setOnline: (online: boolean) => void
  toggleOnline: () => void
  setProductSearch: (q: string) => void
  setActiveCategory: (cat: string) => void
  setActiveOrder: (id: string | null) => void
  setProductEditId: (id: string | null) => void
  setAdjustingProductId: (id: string | null) => void
  logout: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      screen: 'login',
      sidebarOpen: false,
      toast: null,
      isOnline: navigator.onLine,
      productSearch: '',
      activeCategory: 'all',
      activeOrderId: null,
      productEditId: null,
      adjustingProductId: null,

      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setScreen: (screen) => set({ screen, sidebarOpen: false }),
      toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
      closeSidebar: () => set({ sidebarOpen: false }),
      showToast: (toast) => set({ toast }),
      hideToast: () => set({ toast: null }),
      setOnline: (isOnline) => set({ isOnline }),
      toggleOnline: () => set(s => ({ isOnline: !s.isOnline })),
      setProductSearch: (productSearch) => set({ productSearch }),
      setActiveCategory: (activeCategory) => set({ activeCategory }),
      setActiveOrder: (activeOrderId) => set({ activeOrderId }),
      setProductEditId: (productEditId) => set({ productEditId }),
      setAdjustingProductId: (adjustingProductId) => set({ adjustingProductId }),
      logout: () => set({
        user: null,
        session: null,
        screen: 'login',
        sidebarOpen: false,
        productSearch: '',
        activeCategory: 'all',
      }),
    }),
    {
      name: 'nexuspos-app',
      partialize: (s) => ({ user: s.user, session: s.session }),
    },
  ),
)
