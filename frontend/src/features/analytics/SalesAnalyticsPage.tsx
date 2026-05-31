import { useQueries } from '@tanstack/react-query'
import { fmt } from '@/lib/utils'
import { StatCard, Table, Th, Td } from '@/components/ui'
import { analyticsService } from '@/services/analytics/analytics.service'
import { useAnalyticsFilters, AnalyticsFilters, ChartCard } from './analyticsHelpers'

export default function SalesAnalyticsPage() {
  const filters = useAnalyticsFilters()
  const { from, to, branch, apiParams } = filters

  const [summaryQ, topProductsQ, byCashierQ] = useQueries({
    queries: [
      {
        queryKey: ['sales-summary', from, to, branch],
        queryFn:  () => analyticsService.getSalesSummary(apiParams),
      },
      {
        queryKey: ['sales-top-products', from, to, branch],
        queryFn:  () => analyticsService.getTopProducts({ ...apiParams, limit: 10 }),
      },
      {
        queryKey: ['sales-by-cashier', from, to, branch],
        queryFn:  () => analyticsService.getSalesByCashier(apiParams),
      },
    ],
  })

  const summary     = summaryQ.data
  const topProducts = topProductsQ.data ?? []
  const cashiers    = byCashierQ.data ?? []

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header + Filters */}
      <div className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-zinc-100">Sales Analytics</h2>
        <AnalyticsFilters {...filters} />
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {summaryQ.isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-zinc-900 border border-zinc-800 animate-pulse" />
          ))
        ) : summary ? (
          <>
            <StatCard label="Orders"      value={summary.order_count.toLocaleString()} />
            <StatCard label="Gross Sales" value={fmt(summary.gross_sales)} accent />
            <StatCard label="Net Sales"   value={fmt(summary.net_sales)} />
            <StatCard label="Avg Order"   value={fmt(summary.average_order_value)} />
            <StatCard label="Customers"   value={summary.unique_customers.toLocaleString()} />
            <StatCard
              label="Refunds"
              value={fmt(summary.refund_amount)}
              accent={parseFloat(summary.refund_amount) > 0}
            />
          </>
        ) : null}
      </div>

      {/* Top Products */}
      <ChartCard
        title="Top Products"
        isLoading={topProductsQ.isLoading}
        isEmpty={topProducts.length === 0}
      >
        <Table>
          <thead>
            <tr>
              <Th>#</Th>
              <Th>Product</Th>
              <Th>SKU</Th>
              <Th right>Qty Sold</Th>
              <Th right>Revenue</Th>
              <Th right>Profit Est.</Th>
            </tr>
          </thead>
          <tbody>
            {topProducts.map((p, i) => (
              <tr key={p.product_id} className="hover:bg-zinc-800/40 transition-colors">
                <Td muted>{i + 1}</Td>
                <Td>{p.product_name}</Td>
                <Td muted mono>{p.sku ?? '—'}</Td>
                <Td right><span className="font-mono">{p.quantity_sold}</span></Td>
                <Td right><span className="font-mono text-amber-400">{fmt(p.revenue)}</span></Td>
                <Td right><span className="font-mono text-green-400">{fmt(p.profit_estimate)}</span></Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </ChartCard>

      {/* By Cashier */}
      <ChartCard
        title="Sales by Cashier"
        isLoading={byCashierQ.isLoading}
        isEmpty={cashiers.length === 0}
      >
        <Table>
          <thead>
            <tr>
              <Th>Cashier</Th>
              <Th right>Orders</Th>
              <Th right>Sales</Th>
              <Th right>Refunds</Th>
              <Th right>Avg Ticket</Th>
            </tr>
          </thead>
          <tbody>
            {cashiers.map(c => (
              <tr key={c.cashier_id} className="hover:bg-zinc-800/40 transition-colors">
                <Td>{c.cashier_name}</Td>
                <Td right><span className="font-mono">{c.orders}</span></Td>
                <Td right><span className="font-mono text-amber-400">{fmt(c.sales)}</span></Td>
                <Td right><span className="font-mono text-red-400">{fmt(c.refunds)}</span></Td>
                <Td right><span className="font-mono text-zinc-400">{fmt(c.average_ticket)}</span></Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </ChartCard>
    </div>
  )
}
