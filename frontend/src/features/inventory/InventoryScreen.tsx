import { useState } from 'react'
import { fmt } from '@/lib/utils'
import { CATEGORIES_DATA } from '@/lib/constants'
import { useAppStore } from '@/store/appStore'
import { useProductsStore } from '@/store/productsStore'
import AppShell from '@/layouts/AppShell'
import { StatCard, Table, Th, Td, Btn, StockBadge, Empty } from '@/components/ui'
import { IconInventory } from '@/components/icons'
import StockBar from '@/features/inventory/StockBar'
import AdjustmentModal from '@/features/inventory/AdjustmentModal'

export default function InventoryScreen() {
  const { adjustingProductId, setAdjustingProductId } = useAppStore()
  const products = useProductsStore(s => s.products)

  const [search, setSearch]               = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const filtered = products.filter(p => {
    const matchCat    = categoryFilter === 'all' || p.category === categoryFilter
    const q           = search.toLowerCase()
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    return matchCat && matchSearch
  })

  const outOfStock = products.filter(p => p.stock === 0).length
  const lowStock   = products.filter(p => p.stock > 0 && p.stock <= 10).length
  const totalValue = products.reduce((sum, p) => sum + p.stock * p.cost, 0)

  const adjustingProduct = adjustingProductId
    ? products.find(p => p.id === adjustingProductId) ?? null
    : null

  return (
    <AppShell
      title="Inventory"
      search={search}
      onSearchChange={setSearch}
    >
      <div className="p-6 flex flex-col gap-5 h-full overflow-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Items"   value={products.length} />
          <StatCard label="Out of Stock"  value={outOfStock} />
          <StatCard label="Low Stock"     value={lowStock} />
          <StatCard label="Total Value"   value={fmt(totalValue)} accent />
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 flex-shrink-0">
          {CATEGORIES_DATA.map(cat => {
            const active = categoryFilter === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${
                  active
                    ? 'bg-amber-500 border-amber-400 text-black'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                }`}
              >
                {cat.name}
              </button>
            )
          })}
        </div>

        {/* Table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
          <Table>
            <thead>
              <tr>
                <Th>Product</Th>
                <Th>SKU</Th>
                <Th>Category</Th>
                <Th>Stock Level</Th>
                <Th>Unit</Th>
                <Th>Status</Th>
                <Th>Adjust</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <Empty
                      icon={<IconInventory width="40" height="40" />}
                      title="No products found"
                      subtitle="Try adjusting your search or category filter"
                    />
                  </td>
                </tr>
              ) : (
                filtered.map(product => (
                  <tr key={product.id} className="hover:bg-zinc-800/30 transition-colors duration-100">
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-1 h-8 rounded-full flex-shrink-0"
                          style={{ backgroundColor: product.color }}
                        />
                        <span className="font-medium text-zinc-100">{product.name}</span>
                      </div>
                    </Td>
                    <Td mono muted>{product.sku}</Td>
                    <Td>
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border"
                        style={{
                          backgroundColor: `${product.color}20`,
                          borderColor: `${product.color}40`,
                          color: product.color,
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: product.color }} />
                        {CATEGORIES_DATA.find(c => c.id === product.category)?.name ?? product.category}
                      </span>
                    </Td>
                    <Td className="min-w-[160px]">
                      <StockBar stock={product.stock} />
                    </Td>
                    <Td muted>{product.unit}</Td>
                    <Td><StockBadge stock={product.stock} /></Td>
                    <Td>
                      <Btn
                        variant="outline"
                        size="xs"
                        onClick={() => setAdjustingProductId(product.id)}
                      >
                        Adjust
                      </Btn>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>

          <div className="px-4 py-2.5 border-t border-zinc-800 flex-shrink-0">
            <p className="text-xs text-zinc-500">{filtered.length} of {products.length} items</p>
          </div>
        </div>
      </div>

      {/* Adjustment modal */}
      {adjustingProduct && (
        <AdjustmentModal
          product={adjustingProduct}
          onClose={() => setAdjustingProductId(null)}
        />
      )}
    </AppShell>
  )
}
