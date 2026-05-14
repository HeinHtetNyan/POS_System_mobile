import { useState } from 'react'
import type { Product } from '@/types'
import { useProductsStore } from '@/store/productsStore'
import { useAppStore } from '@/store/appStore'
import { Modal, StockBadge, Btn, Input } from '@/components/ui'

interface AdjustmentModalProps {
  product: Product
  onClose: () => void
}

type AdjustType = 'add' | 'remove'

const REASONS = [
  { value: 'recount',          label: 'Recount / Audit' },
  { value: 'damaged',          label: 'Damaged / Spoilage' },
  { value: 'returned',         label: 'Customer Return' },
  { value: 'transferred_in',   label: 'Transfer In' },
  { value: 'transferred_out',  label: 'Transfer Out' },
  { value: 'opening_stock',    label: 'Opening Stock' },
  { value: 'shrinkage',        label: 'Shrinkage / Loss' },
]

export default function AdjustmentModal({ product, onClose }: AdjustmentModalProps) {
  const adjustStock = useProductsStore(s => s.adjustStock)
  const showToast   = useAppStore(s => s.showToast)

  const [type, setType]     = useState<AdjustType>('add')
  const [qty, setQty]       = useState('')
  const [reason, setReason] = useState(REASONS[0].value)

  const qtyNum    = parseInt(qty, 10) || 0
  const delta     = type === 'add' ? qtyNum : -qtyNum
  const newStock  = Math.max(0, product.stock + delta)

  function handleApply() {
    if (!qtyNum || qtyNum <= 0) {
      showToast({ message: 'Please enter a valid quantity.', type: 'warning' })
      return
    }
    adjustStock(product.id, delta)
    showToast({
      message: `Stock ${type === 'add' ? 'added' : 'removed'}: ${qtyNum} ${product.unit}(s) — ${product.name}`,
      type: 'success',
    })
    onClose()
  }

  const selectClass =
    'w-full bg-zinc-900 border border-zinc-700 rounded-xl text-zinc-100 text-sm px-3 py-2.5 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all duration-150'

  return (
    <Modal open onClose={onClose} title="Stock Adjustment" size="md">
      <div className="flex flex-col gap-4">
        {/* Product info */}
        <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: product.color }} />
            <div>
              <p className="text-sm font-semibold text-zinc-100">{product.name}</p>
              <p className="text-xs text-zinc-500 font-mono">{product.sku}</p>
            </div>
          </div>
          <StockBadge stock={product.stock} />
        </div>

        {/* Type toggle */}
        <div className="flex rounded-xl overflow-hidden border border-zinc-700">
          <button
            onClick={() => setType('add')}
            className={`flex-1 py-2.5 text-sm font-semibold transition-colors duration-150 ${
              type === 'add'
                ? 'bg-green-600 text-white'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            + Add
          </button>
          <button
            onClick={() => setType('remove')}
            className={`flex-1 py-2.5 text-sm font-semibold transition-colors duration-150 ${
              type === 'remove'
                ? 'bg-red-600 text-white'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            − Remove
          </button>
        </div>

        {/* Quantity */}
        <Input
          label="Quantity"
          type="number"
          min="1"
          placeholder="0"
          value={qty}
          onChange={e => setQty(e.target.value)}
        />

        {/* Reason */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Reason</label>
          <select
            className={selectClass}
            value={reason}
            onChange={e => setReason(e.target.value)}
          >
            {REASONS.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        {/* Preview */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-zinc-500">New stock level</span>
          <span className="font-mono font-bold text-zinc-100">
            {product.stock} → <span className={newStock === 0 ? 'text-red-400' : newStock <= 10 ? 'text-amber-400' : 'text-green-400'}>{newStock}</span>
            <span className="text-zinc-500 text-xs ml-1">{product.unit}</span>
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-zinc-800">
          <Btn variant="secondary" fullWidth onClick={onClose}>Cancel</Btn>
          <Btn
            variant={type === 'add' ? 'success' : 'danger'}
            fullWidth
            onClick={handleApply}
          >
            Apply Adjustment
          </Btn>
        </div>
      </div>
    </Modal>
  )
}
