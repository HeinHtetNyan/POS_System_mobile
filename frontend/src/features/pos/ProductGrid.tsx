import type { Product, CartItem } from '@/types'
import { Empty } from '@/components/ui'
import { IconProducts } from '@/components/icons'
import ProductCard from '@/features/pos/ProductCard'

interface ProductGridProps {
  products: Product[]
  cartItems: CartItem[]
  onAdd: (p: Product) => void
}

export default function ProductGrid({ products, cartItems, onAdd }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <Empty
        icon={<IconProducts width="48" height="48" />}
        title="No products found"
        subtitle="Try a different search or category"
      />
    )
  }

  return (
    <div
      className="grid gap-2 p-2"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}
    >
      {products.map(product => {
        const cartItem = cartItems.find(i => i.id === product.id)
        return (
          <ProductCard
            key={product.id}
            product={product}
            cartQty={cartItem?.qty ?? 0}
            onAdd={onAdd}
          />
        )
      })}
    </div>
  )
}
