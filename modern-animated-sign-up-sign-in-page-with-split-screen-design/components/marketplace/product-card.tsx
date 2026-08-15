import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { Product } from "@/lib/marketplace/types"
import { getCategoryLabel, formatCondition, formatDate } from "@/lib/marketplace/utils"
import { CategoryIcon } from "@/components/marketplace/category-icon"
import { ChatButton } from "@/components/chat/chat-button"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const hasPhoto = product.photos.length > 0

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#12121a] transition-all duration-300 hover:border-purple-500/25 hover:shadow-[0_8px_32px_rgba(168,85,247,0.12)]">
      <Link href={`/marketplace/${product.id}`} className="flex flex-1 flex-col">
        <div className="relative aspect-[4/3] overflow-hidden bg-[#1a1a26]">
          {hasPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.photos[0]}
              alt={product.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-purple-400/60">
              <CategoryIcon category={product.category} className="w-10 h-10" />
              <span className="text-xs text-white/30">{getCategoryLabel(product.category)}</span>
            </div>
          )}
          <div className="absolute left-3 top-3 rounded-lg bg-black/50 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-purple-300 backdrop-blur-sm">
            {getCategoryLabel(product.category)}
          </div>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <h3 className="line-clamp-1 text-base font-semibold text-white group-hover:text-purple-300 transition-colors">
            {product.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-white/45">{product.description}</p>
          <div className="mt-auto flex items-center justify-between pt-4">
            <span className="rounded-md bg-white/5 px-2 py-1 text-xs text-white/50">
              {formatCondition(product.condition)}
            </span>
            <span className="text-xs text-white/30">{formatDate(product.createdAt)}</span>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs font-medium text-purple-400 opacity-0 transition-opacity group-hover:opacity-100">
            View details
            <ArrowRight className="h-3 w-3" />
          </div>
        </div>
      </Link>
      <div className="border-t border-white/5 px-4 py-3">
        <ChatButton
          itemId={product.id}
          itemType="marketplace"
          itemTitle={product.title}
          otherPartyName={product.sellerName}
          variant="compact"
          className="w-full justify-center py-2"
        />
      </div>
    </div>
  )
}
