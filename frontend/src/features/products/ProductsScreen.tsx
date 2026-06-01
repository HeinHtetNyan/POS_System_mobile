import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { productsService } from '@/services/products/products.service'
import { categoriesService } from '@/services/categories/categories.service'
import { brandsService } from '@/services/brands/brands.service'
import { inventoryService } from '@/services/inventory/inventory.service'
import { useTenantStore } from '@/store/tenant.store'
import { fmt } from '@/lib/utils'
import { StatCard, Table, Th, Td, Btn, Empty, Spinner } from '@/components/ui'
import { IconPlus, IconProducts, IconSearch } from '@/components/icons'
import { ProductBarcodeCard } from '@/scanner'
import { LabelPrintPreviewModal } from '@/components/hardware/PrintPreviewModal'
import type { Product as BackendProduct } from '@/shared/types'
import { ProductFormModal } from './ProductFormModal'

// ProductFormModal is now in ./ProductFormModal.tsx
function CategoryBadge({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border bg-zinc-800 border-zinc-700 text-zinc-300">
      {name}
    </span>
  )
}

function StockBadge({ qty }: { qty: number }) {
  if (qty === 0) return <span className="text-xs px-2 py-0.5 rounded-full bg-red-950 border border-red-800 text-red-400">Out of Stock</span>
  if (qty <= 10) return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-950 border border-amber-800 text-amber-400">Low Stock</span>
  return <span className="text-xs px-2 py-0.5 rounded-full bg-green-950 border border-green-800 text-green-400">In Stock</span>
}

interface PromoInfo {
  hasPromo: boolean
  isActive: boolean
  isScheduled: boolean
  isExpired: boolean
  valueLabel: string   // e.g. "10%" or "500.00 Kyats"
  startDate: string | null
  endDate: string | null
}

function getPromoInfo(product: BackendProduct): PromoInfo {
  if (!product.discount_type || !product.discount_value) {
    return { hasPromo: false, isActive: false, isScheduled: false, isExpired: false, valueLabel: '', startDate: null, endDate: null }
  }
  const now = Date.now()
  const start = product.discount_start_at ? new Date(product.discount_start_at).getTime() : null
  const end   = product.discount_end_at   ? new Date(product.discount_end_at).getTime()   : null
  const isScheduled = start !== null && now < start
  const isExpired   = end   !== null && now > end
  const isActive    = !isScheduled && !isExpired
  const val = parseFloat(product.discount_value)
  const valueLabel = product.discount_type === 'PERCENTAGE'
    ? `${val}%`
    : `${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Kyats`
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return {
    hasPromo: true, isActive, isScheduled, isExpired, valueLabel,
    startDate: product.discount_start_at ? fmtDate(product.discount_start_at) : null,
    endDate:   product.discount_end_at   ? fmtDate(product.discount_end_at)   : null,
  }
}

function PromoBadge({ product }: { product: BackendProduct }) {
  const p = getPromoInfo(product)
  if (!p.hasPromo) return <span className="text-zinc-600 text-xs">—</span>
  if (p.isExpired) {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-500 line-through">
        {p.valueLabel}
      </span>
    )
  }
  if (p.isScheduled) {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-950 border border-blue-800 text-blue-400">
        {p.valueLabel} · Scheduled
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-950 border border-green-800 text-green-400 font-semibold">
      {p.valueLabel} off
    </span>
  )
}

const PAGE_SIZE = 50

export default function ProductsScreen() {
  const qc = useQueryClient()
  const [search, setSearch]               = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [page, setPage]                   = useState(1)
  const [selectedId, setSelectedId]       = useState<string | null>(null)
  const [showForm, setShowForm]           = useState(false)
  const [editProduct, setEditProduct]     = useState<BackendProduct | null>(null)

  // Reset to page 1 whenever search or category changes
  function handleSearch(q: string) {
    setSearch(q)
    setPage(1)
    clearTimeout((handleSearch as { _t?: ReturnType<typeof setTimeout> })._t)
    const t = setTimeout(() => setDebouncedSearch(q), 300)
    ;(handleSearch as { _t?: ReturnType<typeof setTimeout> })._t = t
  }

  function handleCategoryFilter(id: string) {
    setCategoryFilter(id)
    setPage(1)
  }

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', debouncedSearch, categoryFilter, page],
    queryFn: () => productsService.list({
      search: debouncedSearch || undefined,
      category_id: categoryFilter || undefined,
      page,
      page_size: PAGE_SIZE,
    }),
    placeholderData: prev => prev,
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesService.list({ page_size: 100 }),
    staleTime: 5 * 60 * 1000,
  })

  const { data: brandsData } = useQuery({
    queryKey: ['brands'],
    queryFn: () => brandsService.list({ page_size: 100 }),
    staleTime: 5 * 60 * 1000,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsService.delete(id),
    onSuccess: () => {
      toast.success('Product deleted')
      setSelectedId(null)
      qc.invalidateQueries({ queryKey: ['products'] })
    },
    onError: () => toast.error('Failed to delete product'),
  })

  const products = productsData?.items ?? []
  const total = productsData?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const categories = categoriesData?.items ?? []
  const brands = brandsData?.items ?? []

  const categoryMap = useMemo(() => {
    const m = new Map<string, string>()
    for (const c of categories) m.set(c.id, c.name)
    return m
  }, [categories])

  const selectedProduct = selectedId ? products.find(p => p.id === selectedId) : null

  return (
    <>
    {showForm && (
      <ProductFormModal
        product={editProduct ?? undefined}
        onClose={() => setShowForm(false)}
        onSaved={() => qc.invalidateQueries({ queryKey: ['products'] })}
      />
    )}
    <div className="flex flex-col lg:flex-row h-full overflow-y-auto lg:overflow-hidden">
      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 lg:overflow-hidden">
        {/* Sub-navigation */}
        <div className="flex-shrink-0 flex items-center gap-1 px-4 sm:px-6 pt-3 sm:pt-4 border-b border-zinc-800 pb-0">
          <span className="px-3 py-1.5 text-xs font-semibold text-amber-400 border-b-2 border-amber-500 -mb-px">Products</span>
          <Link to="/app/categories" className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-100 border-b-2 border-transparent -mb-px transition-colors">Categories</Link>
          <Link to="/app/brands" className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-100 border-b-2 border-transparent -mb-px transition-colors">Brands</Link>
        </div>

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-800 flex-shrink-0">
          <h2 className="text-base font-semibold text-zinc-100 flex-shrink-0">Products</h2>
          <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-end">
            <div className="relative flex-1 sm:flex-none">
              <IconSearch width="14" height="14" className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Search products…"
                className="bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 text-sm
                  focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all
                  py-2 pl-8 pr-4 w-full sm:w-56"
              />
            </div>
            <Btn size="sm" onClick={() => { setEditProduct(null); setShowForm(true) }}>
              <IconPlus width="14" height="14" />
              <span className="hidden sm:inline">New Product</span>
              <span className="sm:hidden">New</span>
            </Btn>
          </div>
        </div>

        <div className="p-4 sm:p-6 flex flex-col gap-4 sm:gap-5 lg:overflow-auto lg:flex-1 lg:min-h-0">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            <StatCard label="Total SKUs"  value={total} />
            <StatCard label="Active"      value={products.filter(p => p.is_active).length} accent />
            <StatCard label="Inactive"    value={products.filter(p => !p.is_active).length} />
          </div>

          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 flex-shrink-0">
            <button
              onClick={() => handleCategoryFilter('')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                !categoryFilter ? 'bg-amber-500 border-amber-400 text-black' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
              }`}
            >
              All Items
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleCategoryFilter(cat.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  categoryFilter === cat.id ? 'bg-amber-500 border-amber-400 text-black' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-x-auto flex-1 flex flex-col min-h-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-40"><Spinner size={32} /></div>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Product</Th>
                    <Th>SKU</Th>
                    <Th>Category</Th>
                    <Th right>Price</Th>
                    <Th right>Cost</Th>
                    <Th>Promotion</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <Empty icon={<IconProducts width="40" height="40" />} title="No products found" subtitle="Try adjusting your search or filter" />
                      </td>
                    </tr>
                  ) : products.map(product => {
                    const active = selectedId === product.id
                    return (
                      <tr
                        key={product.id}
                        onClick={() => setSelectedId(active ? null : product.id)}
                        className={`cursor-pointer transition-colors duration-100 ${active ? 'bg-zinc-800/80' : 'hover:bg-zinc-800/40'}`}
                      >
                        <Td>
                          <div className="flex items-center gap-2.5">
                            <div className="w-1.5 h-8 rounded-full flex-shrink-0 bg-amber-500/60" />
                            <span className="font-medium text-zinc-100">{product.name}</span>
                          </div>
                        </Td>
                        <Td mono muted>{product.sku}</Td>
                        <Td>
                          <CategoryBadge name={categoryMap.get(product.category_id ?? '') ?? '—'} />
                        </Td>
                        <Td right mono>{fmt(parseFloat(product.selling_price))}</Td>
                        <Td right mono muted>{fmt(parseFloat(product.cost_price))}</Td>
                        <Td>
                          <PromoBadge product={product} />
                        </Td>
                        <Td>
                          {product.is_active
                            ? <span className="text-xs px-2 py-0.5 rounded-full bg-green-950 border border-green-800 text-green-400">Active</span>
                            : <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-500">Inactive</span>
                          }
                        </Td>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
            )}
            <div className="px-4 py-2.5 border-t border-zinc-800 flex-shrink-0 flex items-center justify-between gap-3">
              <p className="text-xs text-zinc-500">
                {total === 0 ? '0 products' : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total}`}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-2 py-1 rounded-lg text-xs text-zinc-400 border border-zinc-700 hover:border-zinc-500 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  ‹ Prev
                </button>
                <span className="text-xs text-zinc-500 px-2">{page} / {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-2 py-1 rounded-lg text-xs text-zinc-400 border border-zinc-700 hover:border-zinc-500 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Next ›
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detail panel */}
      {selectedProduct && (
        <ProductDetailPanel
          product={selectedProduct}
          categoryMap={categoryMap}
          onClose={() => setSelectedId(null)}
          onEdit={() => { setEditProduct(selectedProduct); setShowForm(true) }}
          onDelete={() => deleteMutation.mutate(selectedProduct.id)}
          isDeleting={deleteMutation.isPending}
        />
      )}
    </div>
    </>
  )
}

function ProductDetailPanel({
  product, categoryMap, onClose, onEdit, onDelete, isDeleting,
}: {
  product: BackendProduct
  categoryMap: Map<string, string>
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  isDeleting: boolean
}) {
  const [showLabelPrint, setShowLabelPrint] = useState(false)

  return (
    <>
    {showLabelPrint && (
      <LabelPrintPreviewModal
        product={product}
        onClose={() => setShowLabelPrint(false)}
      />
    )}
    {/* Mobile backdrop */}
    <div
      className="fixed inset-0 bg-black/60 z-40 lg:hidden"
      onClick={onClose}
    />
    <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col overflow-y-auto lg:relative lg:inset-auto lg:z-auto lg:w-80 lg:flex-shrink-0 lg:border-t-0 lg:border-l lg:border-zinc-800">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 flex-shrink-0">
        <span className="text-sm font-semibold text-zinc-100">Product Detail</span>
        <button
          onClick={onClose}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-zinc-100 transition-colors text-xl leading-none"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <div className="p-4 flex flex-col gap-4">
        <div>
          <p className="text-lg font-bold text-zinc-100">{product.name}</p>
          <p className="text-xs font-mono text-zinc-500">{product.sku}</p>
          {product.barcode && <p className="text-xs font-mono text-zinc-600 mt-0.5">Barcode: {product.barcode}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
            <p className="text-xs text-zinc-500 mb-0.5">Selling Price</p>
            <p className="font-mono font-bold text-amber-400">{fmt(parseFloat(product.selling_price))}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
            <p className="text-xs text-zinc-500 mb-0.5">Cost Price</p>
            <p className="font-mono font-bold text-zinc-200">{fmt(parseFloat(product.cost_price))}</p>
          </div>
        </div>

        {/* Promotion / Discount */}
        {(() => {
          const promo = getPromoInfo(product)
          if (!promo.hasPromo) return (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex items-center justify-between">
              <p className="text-xs text-zinc-500">Promotion</p>
              <span className="text-xs text-zinc-600">None</span>
            </div>
          )
          return (
            <div className={`rounded-xl border p-3 flex flex-col gap-2 ${
              promo.isActive    ? 'bg-green-950/40 border-green-800/60' :
              promo.isScheduled ? 'bg-blue-950/40  border-blue-800/60'  :
                                  'bg-zinc-900     border-zinc-800'
            }`}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-zinc-300">Promotion / Discount</p>
                {promo.isActive    && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 border border-green-600/40 text-green-400 font-semibold">Active</span>}
                {promo.isScheduled && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20  border border-blue-600/40  text-blue-400  font-semibold">Scheduled</span>}
                {promo.isExpired   && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-700/40  border border-zinc-600/40  text-zinc-500  font-semibold">Expired</span>}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">Discount</span>
                <span className={`font-mono text-sm font-bold ${promo.isActive ? 'text-green-400' : promo.isScheduled ? 'text-blue-400' : 'text-zinc-500'}`}>
                  {promo.valueLabel}
                  {product.discount_type === 'PERCENTAGE' ? '' : ''}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">Type</span>
                <span className="text-xs text-zinc-300">{product.discount_type === 'PERCENTAGE' ? 'Percentage' : 'Fixed Amount'}</span>
              </div>
              {(promo.startDate || promo.endDate) && (
                <div className="pt-1.5 border-t border-zinc-700/40 flex flex-col gap-1">
                  {promo.startDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500">Start</span>
                      <span className="text-xs text-zinc-300 font-mono">{promo.startDate}</span>
                    </div>
                  )}
                  {promo.endDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500">End</span>
                      <span className="text-xs text-zinc-300 font-mono">{promo.endDate}</span>
                    </div>
                  )}
                </div>
              )}
              {!promo.startDate && !promo.endDate && (
                <p className="text-[10px] text-zinc-600">No time limit — always active</p>
              )}
            </div>
          )
        })()}

        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-500">Category</span>
            <span className="text-zinc-200">{categoryMap.get(product.category_id ?? '') ?? '—'}</span>
          </div>
          {product.description && (
            <div>
              <p className="text-zinc-500 mb-1">Description</p>
              <p className="text-zinc-300 text-xs">{product.description}</p>
            </div>
          )}
        </div>

        {(product.variants ?? []).length > 0 && (
          <div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Variants ({(product.variants ?? []).length})</p>
            {(product.variants ?? []).map(v => (
              <div key={v.id} className="flex justify-between items-center py-1.5 border-b border-zinc-800 text-xs">
                <span className="text-zinc-300">{v.name}</span>
                <span className="font-mono text-zinc-400">{v.sku}</span>
              </div>
            ))}
          </div>
        )}

        {/* Barcode section */}
        <div>
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Barcode</p>
          <ProductBarcodeCard product={product} showPrice compact={false} />
          <button
            onClick={() => setShowLabelPrint(true)}
            className="w-full mt-2 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
          >
            Print Label
          </button>
        </div>

        <div className="pt-2 border-t border-zinc-800 flex gap-2">
          <Btn variant="outline" size="sm" fullWidth onClick={onEdit}>
            Edit
          </Btn>
          <Btn variant="danger" size="sm" fullWidth onClick={onDelete} disabled={isDeleting}>
            {isDeleting ? 'Deleting…' : 'Delete'}
          </Btn>
        </div>
      </div>
    </div>
    </>
  )
}
