import { CATEGORIES_DATA } from '@/lib/constants'
import { useAppStore } from '@/store/appStore'
import { cn } from '@/lib/utils'

export default function CategoryFilter() {
  const activeCategory = useAppStore(s => s.activeCategory)
  const setActiveCategory = useAppStore(s => s.setActiveCategory)

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none flex-shrink-0">
      {CATEGORIES_DATA.map(cat => {
        const isActive = activeCategory === cat.id
        return (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              'flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 whitespace-nowrap',
              isActive
                ? 'text-black border-transparent'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700',
            )}
            style={isActive ? { backgroundColor: cat.color, borderColor: cat.color } : {}}
          >
            {cat.name}
          </button>
        )
      })}
    </div>
  )
}
