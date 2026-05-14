import { useState } from 'react'
import type { Product } from '@/types'
import { fmt } from '@/lib/utils'
import { CATEGORIES_DATA } from '@/lib/constants'
import { useAppStore } from '@/store/appStore'
import { useProductsStore } from '@/store/productsStore'
import AppShell from '@/layouts/AppShell'
import { StatCard, Table, Th, Td, Btn, StockBadge, Empty } from '@/components/ui'
import { IconPlus, IconProducts } from '@/components/icons'
import ProductFormModal from '@/features/products/ProductFormModal'
import ProductDetailPanel from '@/features/products/ProductDetailPanel'

export default function ProductsScreen() {
  const { productEditId, setProductEditId, showToast } = useAppStore()
  const { products, updateProduct, addProduct } = useProductsStore()

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)

  const filtered = products.filter(p => {
    const matchCat = categoryFilter === 'all' || p.category === categoryFilter
    const q = search.toLowerCase()
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    return matchCat && matchSearch
  })

  const outOfStock  = products.filter(p => p.stock === 0).length
  const lowStock    = products.filter(p => p.stock > 0 && p.stock <= 10).length
  const totalValue  = products.reduce((sum, p) => sum + p.stock * p.cost, 0)

  const selectedProduct = productEditId ? products.find(p => p.id === productEditId) ?? null : null

  function handleRowClick(product: Product) {
    setProductEditId(productEditId === product.id ? null : product.id)
  }

  function handleNewProduct() {
    setEditProduct(null)
    setShowForm(true)
  }

  function handleEditProduct() {
    if (selectedProduct) {
      setEditProduct(selectedProduct)
      setShowForm(true)
    }
  }

  function handleSave(p: Product) {
    if (editProduct) {
      updateProduct(p)
      showToast({ message: `"${p.name}" updated.`, type: 'success' })
    } else {
      addProduct(p)
      showToast({ message: `"${p.name}" added.`, type: 'success' })
    }
    setProductEditId(null)
  }

  function handleCloseForm() {
    setShowForm(false)
    setEditProduct(null)
  }

  return (
    <AppShell
      title="Products"
      search={search}
      onSearchChange={setSearch}
      action={
        <Btn size="sm" onClick={handleNewProduct}>
          <IconPlus width="14" height="14" />
          New Product
        </Btn>
      }
    >
      <div className="flex h-full">
        {/* Main area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="p-6 flex flex-col gap-5 overflow-auto h-full">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total SKUs"    value={products.length} />
              <StatCard label="Out of Stock"  value={outOfStock}  />
              <StatCard label="Low Stock"     value={lowStock}    />
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
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex-1 flex flex-col min-h-0">
              <Table>
                <thead>
                  <tr>
                    <Th>Product</Th>
                    <Th>SKU</Th>
                    <Th>Category</Th>
                    <Th right>Price</Th>
                    <Th right>Cost</Th>
                    <Th right>Stock</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <Empty
                          icon={<IconProducts width="40" height="40" />}
                          title="No products found"
                          subtitle="Try adjusting your search or filter"
                        />
                      </td>
                    </tr>
                  ) : (
                    filtered.map(product => {
                      const active = productEditId === product.id
                      return (
                        <tr
                          key={product.id}
                          onClick={() => handleRowClick(product)}
                          className={`cursor-pointer transition-colors duration-100 ${
                            active ? 'bg-zinc-800/80' : 'hover:bg-zinc-800/40'
                          }`}
                        >
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
                          <Td right mono>{fmt(product.price)}</Td>
                          <Td right mono muted>{fmt(product.cost)}</Td>
                          <Td right mono>{product.stock}</Td>
                          <Td><StockBadge stock={product.stock} /></Td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </Table>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-zinc-800 flex-shrink-0">
                <p className="text-xs text-zinc-500">{filtered.length} of {products.length} products</p>
              </div>
            </div>
          </div>
        </div>

        {/* Detail panel */}
        {selectedProduct && (
          <ProductDetailPanel
            product={selectedProduct}
            onEdit={handleEditProduct}
            onClose={() => setProductEditId(null)}
          />
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <ProductFormModal
          product={editProduct}
          onSave={handleSave}
          onClose={handleCloseForm}
        />
      )}
    </AppShell>
  )
}
