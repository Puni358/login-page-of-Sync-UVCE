import Link from "next/link"
import { ArrowRight, CheckCircle2, MapPin } from "lucide-react"
import type { Product } from "@/lib/marketplace/types"
import { formatDate, formatPrice } from "@/lib/marketplace/utils"
import { CategoryIcon } from "@/components/marketplace/category-icon"
import { ChatButton } from "@/components/chat/chat-button"
import { cn } from "@/lib/utils"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const hasPhoto = product.photos.length > 0
  const isSold = product.status === "sold"

  return (
    <div
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#12121a] transition-all duration-300 hover:border-purple-500/25 hover:shadow-[0_8px_32px_rgba(168,85,247,0.12)]",
        isSold && "opacity-75 hover:opacity-100 border-emerald-500/20"
      )}
    >
      <Link href={`/marketplace/${product.id}`} className="flex flex-1 flex-col">
        <div className="relative aspect-[4/3] overflow-hidden bg-[#1a1a26]">
          {hasPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.photos[0]}
              alt={product.title}
              className={cn(
                "h-full w-full object-cover transition-transform duration-500 group-hover:scale-105",
                isSold && "grayscale-[25%]"
              )}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-purple-400/60">
              {product.category ? (
                <CategoryIcon category={product.category} className="w-10 h-10" />
              ) : (
                <span className="text-2xl">📦</span>
              )}
            </div>
          )}

          <div className="absolute left-3 top-3 rounded-lg bg-black/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-purple-300 backdrop-blur-md border border-white/10">
            {formatPrice(product.price)}
          </div>

          {/* Sold Badge */}
          {isSold && (
            <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-lg bg-emerald-600/90 px-2.5 py-1 text-[11px] font-bold text-white shadow-lg backdrop-blur-md border border-emerald-400/30">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-200" />
              <span>✓ Sold</span>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 text-base font-semibold text-white group-hover:text-purple-300 transition-colors">
              {product.title}
            </h3>
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-white/45">{product.description}</p>
          <div className="mt-auto flex items-center justify-between pt-4">
            <span className="flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-xs text-white/50">
              <MapPin className="h-3 w-3" />
              <span className="line-clamp-1">{product.location}</span>
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
          otherPartyUserId={product.sellerId}
          variant="compact"
          className="w-full justify-center py-2"
        />
      </div>
    </div>
  )
}
