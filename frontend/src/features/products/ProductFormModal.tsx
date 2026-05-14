import { useState } from 'react'
import type { Product } from '@/types'
import { CATEGORIES_DATA } from '@/lib/constants'
import { genId } from '@/lib/utils'
import { Modal, Input, Btn } from '@/components/ui'

interface ProductFormModalProps {
  product: Product | null
  onSave: (p: Product) => void
  onClose: () => void
}

const UNITS = ['item', 'cup', 'bottle', 'pack', 'box', 'kg', 'litre'] as const
const TAX_OPTIONS = [
  { label: '0% (exempt)',    value: 0 },
  { label: '5%',            value: 0.05 },
  { label: '10% (standard)',value: 0.10 },
  { label: '15%',           value: 0.15 },
  { label: '20%',           value: 0.20 },
]

interface FormState {
  sku: string
  barcode: string
  name: string
  category: string
  price: string
  cost: string
  stock: string
  unit: string
  taxRate: string
}

function initForm(product: Product | null): FormState {
  if (!product) {
    return {
      sku: '',
      barcode: '',
      name: '',
      category: 'beverages',
      price: '',
      cost: '',
      stock: '',
      unit: 'item',
      taxRate: '0.1',
    }
  }
  return {
    sku: product.sku,
    barcode: product.barcode,
    name: product.name,
    category: product.category,
    price: String(product.price),
    cost: String(product.cost),
    stock: String(product.stock),
    unit: product.unit,
    taxRate: String(product.taxRate),
  }
}

export default function ProductFormModal({ product, onSave, onClose }: ProductFormModalProps) {
  const [form, setForm] = useState<FormState>(() => initForm(product))
  const [error, setError] = useState('')

  const categories = CATEGORIES_DATA.filter(c => c.id !== 'all')
  const isEdit = product !== null

  function set(field: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleSave() {
    if (!form.name.trim()) { setError('Product name is required.'); return }
    if (!form.sku.trim())  { setError('SKU is required.'); return }
    if (!form.price)       { setError('Price is required.'); return }

    const cat = categories.find(c => c.id === form.category) ?? categories[0]
    const saved: Product = {
      id:       product?.id ?? genId('p'),
      sku:      form.sku.trim(),
      barcode:  form.barcode.trim(),
      name:     form.name.trim(),
      category: cat.id,
      price:    parseFloat(form.price) || 0,
      cost:     parseFloat(form.cost) || 0,
      stock:    parseInt(form.stock, 10) || 0,
      unit:     form.unit,
      taxRate:  parseFloat(form.taxRate),
      color:    cat.color,
    }
    onSave(saved)
    onClose()
  }

  const selectClass =
    'w-full bg-zinc-900 border border-zinc-700 rounded-xl text-zinc-100 text-sm px-3 py-2.5 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all duration-150'

  return (
    <Modal open onClose={onClose} title={isEdit ? 'Edit Product' : 'New Product'} size="lg">
      <div className="flex flex-col gap-4">
        {error && (
          <p className="text-xs text-red-400 bg-red-950 border border-red-800 rounded-xl px-3 py-2">{error}</p>
        )}

        {/* SKU + Barcode */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="SKU"
            placeholder="BEV-001"
            value={form.sku}
            onChange={e => set('sku', e.target.value)}
          />
          <Input
            label="Barcode"
            placeholder="1000000001"
            value={form.barcode}
            onChange={e => set('barcode', e.target.value)}
          />
        </div>

        {/* Product Name */}
        <Input
          label="Product Name"
          placeholder="e.g. Espresso"
          value={form.name}
          onChange={e => set('name', e.target.value)}
        />

        {/* Category */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Category</label>
          <select
            className={selectClass}
            value={form.category}
            onChange={e => set('category', e.target.value)}
          >
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Price + Cost + Stock */}
        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Price"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            prefix="$"
            value={form.price}
            onChange={e => set('price', e.target.value)}
          />
          <Input
            label="Cost"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            prefix="$"
            value={form.cost}
            onChange={e => set('cost', e.target.value)}
          />
          <Input
            label="Stock"
            type="number"
            min="0"
            placeholder="0"
            prefix="$"
            value={form.stock}
            onChange={e => set('stock', e.target.value)}
          />
        </div>

        {/* Unit + Tax Rate */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Unit</label>
            <select
              className={selectClass}
              value={form.unit}
              onChange={e => set('unit', e.target.value)}
            >
              {UNITS.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Tax Rate</label>
            <select
              className={selectClass}
              value={form.taxRate}
              onChange={e => set('taxRate', e.target.value)}
            >
              {TAX_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-zinc-800">
          <Btn variant="secondary" fullWidth onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" fullWidth onClick={handleSave}>
            {isEdit ? 'Update Product' : 'Create Product'}
          </Btn>
        </div>
      </div>
    </Modal>
  )
}
