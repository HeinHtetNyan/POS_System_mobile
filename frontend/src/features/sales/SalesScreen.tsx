import { useState } from 'react'
import type { Sale, SaleStatus } from '@/types'
import { fmt, fmtDateTime, timeAgo } from '@/lib/utils'
import { useAppStore } from '@/store/appStore'
import { useSalesStore } from '@/store/salesStore'
import AppShell from '@/layouts/AppShell'
import { StatCard, Table, Th, Td, Btn, Badge, Empty, Divider } from '@/components/ui'
import {
  IconSales, IconX, IconCash, IconCard, IconSplit, IconRefund,
} from '@/components/icons'

const STATUS_VARIANT: Record<SaleStatus, 'success' | 'warning' | 'danger'> = {
  completed: 'success',
  refunded:  'warning',
  voided:    'danger',
}

const STATUS_LABEL: Record<SaleStatus, string> = {
  completed: 'Completed',
  refunded:  'Refunded',
  voided:    'Voided',
}

function PaymentIcon({ method }: { method: Sale['paymentMethod'] }) {
  const cls = 'w-4 h-4 flex-shrink-0'
  if (method === 'cash')  return <IconCash  className={cls} />
  if (method === 'card')  return <IconCard  className={cls} />
  return <IconSplit className={cls} />
}

const PAYMENT_LABEL: Record<Sale['paymentMethod'], string> = {
  cash: 'Cash', card: 'Card', split: 'Split',
}

type StatusFilter = 'all' | SaleStatus

export default function SalesScreen() {
  const { activeOrderId, setActiveOrder, showToast } = useAppStore()
  const { sales, updateSale } = useSalesStore()

  const [search, setSearch]           = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const filtered = sales.filter(s => {
    const matchStatus = statusFilter === 'all' || s.status === statusFilter
    const q           = search.toLowerCase()
    const matchSearch = !q
      || s.id.toLowerCase().includes(q)
      || s.cashier.name.toLowerCase().includes(q)
      || s.items.some(i => i.name.toLowerCase().includes(q))
    return matchStatus && matchSearch
  })

  const totalRevenue = sales.filter(s => s.status === 'completed').reduce((sum, s) => sum + s.total, 0)
  const totalRefunds = sales.filter(s => s.status === 'refunded').length
  const avgOrder     = sales.length > 0 ? totalRevenue / Math.max(1, sales.filter(s => s.status === 'completed').length) : 0

  const activeOrder = activeOrderId ? sales.find(s => s.id === activeOrderId) ?? null : null

  function handleRefund(sale: Sale) {
    updateSale(sale.id, { status: 'refunded' })
    showToast({ message: `Order #${sale.id} has been refunded.`, type: 'warning' })
    setActiveOrder(null)
  }

  function handleVoid(sale: Sale) {
    updateSale(sale.id, { status: 'voided' })
    showToast({ message: `Order #${sale.id} has been voided.`, type: 'warning' })
  }

  return (
    <AppShell
      title="Sales History"
      search={search}
      onSearchChange={setSearch}
    >
      <div className="flex h-full">
        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="p-6 flex flex-col gap-5 overflow-auto h-full">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Orders"    value={sales.length} />
              <StatCard label="Revenue"         value={fmt(totalRevenue)} accent />
              <StatCard label="Refunds"         value={totalRefunds} />
              <StatCard label="Avg Order Value" value={fmt(avgOrder)} />
            </div>

            {/* Filters */}
            <div className="flex gap-3 items-center flex-wrap">
              <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
                {(['all', 'completed', 'refunded', 'voided'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors duration-150 ${
                      statusFilter === s
                        ? 'bg-amber-500 text-black'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {s === 'all' ? 'All' : STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col flex-1 min-h-0">
              <Table>
                <thead>
                  <tr>
                    <Th>Order ID</Th>
                    <Th>Date</Th>
                    <Th>Cashier</Th>
                    <Th right>Items</Th>
                    <Th>Payment</Th>
                    <Th right>Total</Th>
                    <Th>Status</Th>
                    <Th>Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8}>
                        <Empty
                          icon={<IconSales width="40" height="40" />}
                          title="No sales found"
                          subtitle="Adjust your search or filter"
                        />
                      </td>
                    </tr>
                  ) : (
                    filtered.map(sale => {
                      const active = activeOrderId === sale.id
                      return (
                        <tr
                          key={sale.id}
                          onClick={() => setActiveOrder(active ? null : sale.id)}
                          className={`cursor-pointer transition-colors duration-100 ${
                            active ? 'bg-zinc-800/80' : 'hover:bg-zinc-800/40'
                          }`}
                        >
                          <Td mono>
                            <span className="text-amber-400 text-xs">{sale.id}</span>
                          </Td>
                          <Td muted className="whitespace-nowrap text-xs">{fmtDateTime(sale.date)}</Td>
                          <Td>
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-300 flex-shrink-0">
                                {sale.cashier.initials}
                              </span>
                              <span className="text-xs text-zinc-200">{sale.cashier.name}</span>
                            </div>
                          </Td>
                          <Td right muted>{sale.items.reduce((s, i) => s + i.qty, 0)}</Td>
                          <Td>
                            <div className="flex items-center gap-1.5 text-zinc-400">
                              <PaymentIcon method={sale.paymentMethod} />
                              <span className="text-xs">{PAYMENT_LABEL[sale.paymentMethod]}</span>
                            </div>
                          </Td>
                          <Td right mono>
                            <span className="text-amber-400">{fmt(sale.total)}</span>
                          </Td>
                          <Td>
                            <Badge variant={STATUS_VARIANT[sale.status]} dot>
                              {STATUS_LABEL[sale.status]}
                            </Badge>
                          </Td>
                          <Td>
                            {sale.status === 'completed' && (
                              <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                                <Btn
                                  variant="outline"
                                  size="xs"
                                  onClick={() => handleRefund(sale)}
                                >
                                  Refund
                                </Btn>
                                <Btn
                                  variant="ghost"
                                  size="xs"
                                  onClick={() => handleVoid(sale)}
                                >
                                  Void
                                </Btn>
                              </div>
                            )}
                          </Td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </Table>

              <div className="px-4 py-2.5 border-t border-zinc-800 flex-shrink-0">
                <p className="text-xs text-zinc-500">{filtered.length} of {sales.length} orders</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order detail panel */}
        {activeOrder && (
          <div className="w-80 flex-shrink-0 border-l border-zinc-800 bg-zinc-950 flex flex-col animate-slideIn overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 flex-shrink-0">
              <span className="text-sm font-semibold text-zinc-100">Order Detail</span>
              <button
                onClick={() => setActiveOrder(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                <IconX width="14" height="14" />
              </button>
            </div>

            {/* Meta */}
            <div className="px-4 py-4 border-b border-zinc-800 flex flex-col gap-1 flex-shrink-0">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-amber-400">{activeOrder.id}</span>
                <Badge variant={STATUS_VARIANT[activeOrder.status]} dot>
                  {STATUS_LABEL[activeOrder.status]}
                </Badge>
              </div>
              <p className="text-xs text-zinc-500 mt-1">{fmtDateTime(activeOrder.date)}</p>
              <p className="text-xs text-zinc-500">{timeAgo(activeOrder.date)}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center text-[9px] font-bold text-zinc-300 flex-shrink-0">
                  {activeOrder.cashier.initials}
                </span>
                <span className="text-xs text-zinc-300">{activeOrder.cashier.name}</span>
              </div>
            </div>

            {/* Items */}
            <div className="px-4 py-3 border-b border-zinc-800 flex-shrink-0">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Items</p>
              <div className="flex flex-col gap-2">
                {activeOrder.items.map(item => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-zinc-200">{item.name}</p>
                      <p className="text-[10px] text-zinc-600 font-mono">{item.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono text-zinc-100">{fmt(item.price * item.qty)}</p>
                      <p className="text-[10px] text-zinc-600">×{item.qty} @ {fmt(item.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="px-4 py-3 border-b border-zinc-800 flex-shrink-0">
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>Subtotal</span>
                  <span className="font-mono">{fmt(activeOrder.subtotal)}</span>
                </div>
                {activeOrder.discount > 0 && (
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>Discount</span>
                    <span className="font-mono text-amber-400">−{fmt(activeOrder.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>Tax</span>
                  <span className="font-mono">{fmt(activeOrder.tax)}</span>
                </div>
                <Divider />
                <div className="flex justify-between text-sm font-semibold text-zinc-100">
                  <span>Total</span>
                  <span className="font-mono text-amber-400">{fmt(activeOrder.total)}</span>
                </div>
              </div>
            </div>

            {/* Payment info */}
            <div className="px-4 py-3 border-b border-zinc-800 flex-shrink-0">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Payment</p>
              <div className="flex items-center gap-2 text-zinc-300">
                <PaymentIcon method={activeOrder.paymentMethod} />
                <span className="text-sm">{PAYMENT_LABEL[activeOrder.paymentMethod]}</span>
              </div>
              {activeOrder.amountTendered != null && (
                <div className="mt-2 text-xs text-zinc-500 flex justify-between">
                  <span>Tendered</span>
                  <span className="font-mono">{fmt(activeOrder.amountTendered)}</span>
                </div>
              )}
              {activeOrder.change != null && activeOrder.change > 0 && (
                <div className="text-xs text-zinc-500 flex justify-between">
                  <span>Change</span>
                  <span className="font-mono">{fmt(activeOrder.change)}</span>
                </div>
              )}
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Footer action */}
            {activeOrder.status === 'completed' && (
              <div className="px-4 py-4 border-t border-zinc-800 flex-shrink-0">
                <Btn
                  variant="danger"
                  fullWidth
                  size="sm"
                  onClick={() => handleRefund(activeOrder)}
                >
                  <IconRefund width="14" height="14" />
                  Issue Refund
                </Btn>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}
