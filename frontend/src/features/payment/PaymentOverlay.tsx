import { useCartStore, useCartTotals } from '@/store/cartStore'
import { useSalesStore } from '@/store/salesStore'
import { useSyncStore } from '@/store/syncStore'
import { useAppStore } from '@/store/appStore'
import { fmt, genId } from '@/lib/utils'
import { IconX, IconCash, IconCard, IconSplit } from '@/components/icons'
import { Spinner } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { PaymentMethod, Sale } from '@/types'
import CashPayment from '@/features/payment/CashPayment'
import CardPayment from '@/features/payment/CardPayment'
import SplitPayment from '@/features/payment/SplitPayment'
import ReceiptScreen from '@/features/payment/ReceiptScreen'

const METHODS: { id: PaymentMethod; label: string; icon: typeof IconCash; color: string; activeClass: string }[] = [
  {
    id: 'cash',
    label: 'Cash',
    icon: IconCash,
    color: 'amber',
    activeClass: 'bg-amber-500/20 border-amber-500/50 text-amber-400',
  },
  {
    id: 'card',
    label: 'Card',
    icon: IconCard,
    color: 'blue',
    activeClass: 'bg-blue-500/20 border-blue-500/50 text-blue-400',
  },
  {
    id: 'split',
    label: 'Split',
    icon: IconSplit,
    color: 'violet',
    activeClass: 'bg-violet-500/20 border-violet-500/50 text-violet-400',
  },
]

export default function PaymentOverlay() {
  const items = useCartStore(s => s.items)
  const discount = useCartStore(s => s.discount)
  const note = useCartStore(s => s.note)
  const checkoutStep = useCartStore(s => s.checkoutStep)
  const setCheckoutStep = useCartStore(s => s.setCheckoutStep)
  const paymentMethod = useCartStore(s => s.paymentMethod)
  const setPaymentMethod = useCartStore(s => s.setPaymentMethod)
  const paymentAmount = useCartStore(s => s.paymentAmount)
  const setPaymentAmount = useCartStore(s => s.setPaymentAmount)
  const splitPayments = useCartStore(s => s.splitPayments)
  const addSplitPayment = useCartStore(s => s.addSplitPayment)
  const removeSplitPayment = useCartStore(s => s.removeSplitPayment)
  const completeSale = useCartStore(s => s.completeSale)
  const totals = useCartTotals()

  const addSale = useSalesStore(s => s.addSale)
  const enqueue = useSyncStore(s => s.enqueue)
  const user = useAppStore(s => s.user)

  if (checkoutStep === 'receipt') return <ReceiptScreen />

  function doProcess() {
    setCheckoutStep('processing')

    setTimeout(() => {
      const tendered = paymentMethod === 'cash' ? parseFloat(paymentAmount) || 0 : 0
      const change = paymentMethod === 'cash' ? Math.max(0, tendered - totals.total) : 0

      const sale: Sale = {
        id: genId('sale'),
        date: new Date(),
        cashier: user ?? {
          id: 'guest',
          name: 'Guest',
          email: '',
          role: 'CASHIER',
          initials: 'GU',
        },
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          sku: item.sku,
          price: item.price,
          qty: item.qty,
          taxRate: item.taxRate,
        })),
        subtotal: totals.itemSubtotal,
        discount: totals.orderDiscAmt,
        tax: totals.tax,
        total: totals.total,
        paymentMethod,
        ...(paymentMethod === 'cash' && {
          amountTendered: tendered,
          change,
        }),
        ...(paymentMethod === 'split' && {
          splitPayments,
        }),
        status: 'completed',
        ...(note && { note }),
      }

      addSale(sale)
      enqueue('SALE_CREATE', { saleId: sale.id })
      completeSale(sale)
    }, 1400)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={() => checkoutStep === 'payment' && setCheckoutStep('cart')}
      />

      {/* Slide-in panel */}
      <div
        className="fixed top-0 right-0 bottom-0 z-50 flex flex-col bg-zinc-950 border-l border-zinc-800 shadow-2xl animate-slideIn"
        style={{ width: 'min(100vw, 28rem)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <p className="text-base font-bold text-zinc-100">Payment</p>
            <span className="text-xs text-zinc-600">
              {totals.itemCount} item{totals.itemCount !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-lg font-bold text-amber-400">{fmt(totals.total)}</span>
            <button
              onClick={() => setCheckoutStep('cart')}
              className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 flex items-center justify-center text-zinc-500 hover:text-zinc-100 transition-colors"
              aria-label="Close payment"
            >
              <IconX width="14" height="14" />
            </button>
          </div>
        </div>

        {/* Method tabs */}
        <div className="flex gap-1.5 px-4 pt-4 pb-2 flex-shrink-0">
          {METHODS.map(m => {
            const Icon = m.icon
            const isActive = paymentMethod === m.id
            return (
              <button
                key={m.id}
                onClick={() => setPaymentMethod(m.id)}
                className={cn(
                  'flex-1 h-10 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border',
                  isActive
                    ? m.activeClass
                    : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700',
                )}
              >
                <Icon width="13" height="13" />
                {m.label}
              </button>
            )
          })}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto min-h-0 px-4 py-3">
          {paymentMethod === 'cash' && (
            <CashPayment
              total={totals.total}
              amount={paymentAmount}
              onAmountChange={setPaymentAmount}
              onProcess={doProcess}
            />
          )}
          {paymentMethod === 'card' && (
            <CardPayment
              total={totals.total}
              onProcess={doProcess}
            />
          )}
          {paymentMethod === 'split' && (
            <SplitPayment
              total={totals.total}
              splitPayments={splitPayments}
              onAdd={addSplitPayment}
              onRemove={removeSplitPayment}
              onProcess={doProcess}
            />
          )}
        </div>
      </div>

      {/* Full-screen processing overlay */}
      {checkoutStep === 'processing' && (
        <div className="fixed inset-0 z-[60] bg-zinc-950/95 flex flex-col items-center justify-center gap-4">
          <Spinner size={48} />
          <p className="text-sm font-semibold text-zinc-400 animate-pulse">Processing Payment…</p>
        </div>
      )}
    </>
  )
}
