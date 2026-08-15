"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, MapPin } from "lucide-react"
import { SellerContactPanel } from "@/components/marketplace/seller-contact-panel"
import { ChatButton } from "@/components/chat/chat-button"
import { getProductById } from "@/lib/marketplace/product-service"
import type { Product } from "@/lib/marketplace/types"
import { formatDate, formatPrice } from "@/lib/marketplace/utils"
import { useAuth } from "@/lib/auth/auth-context"

export default function ProductDetailPage() {
  const params = useParams()
  const { isAuthenticated, user } = useAuth()
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const productId = params.id as string
  const loginHref = `/?redirect=${encodeURIComponent(`/marketplace/${productId}`)}&mode=login`

  useEffect(() => {
    getProductById(productId)
      .then(setProduct)
      .finally(() => setIsLoading(false))
  }, [productId])

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-32 rounded-lg bg-white/5" />
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="aspect-[4/3] rounded-2xl bg-white/5" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 rounded-lg bg-white/5" />
            <div className="h-24 rounded-lg bg-white/5" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="rounded-2xl border border-white/5 bg-[#12121a] px-6 py-16 text-center">
        <p className="text-white/50">Product not found.</p>
        <Link
          href="/marketplace"
          className="mt-4 inline-flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to marketplace
        </Link>
      </div>
    )
  }

  const isOwnListing = user?.id === product.sellerId

  return (
    <div className="space-y-6">
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to marketplace
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Photo */}
        <div className="space-y-3">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/5 bg-[#1a1a26]">
            {product.photos.length > 0 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.photos[0]}
                alt={product.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-white/30">
                No photo available
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-purple-500/15 px-2.5 py-1 text-sm font-semibold text-purple-300">
                {formatPrice(product.price)}
              </span>
              <span className="flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1 text-xs text-white/50">
                <MapPin className="h-3 w-3" />
                {product.location}
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-bold text-white sm:text-3xl">{product.title}</h1>
            <p className="mt-1 text-sm text-white/40">Listed on {formatDate(product.createdAt)}</p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#12121a] p-5">
            <h2 className="mb-2 text-sm font-medium text-white/60">Description</h2>
            <p className="text-sm leading-relaxed text-white/80 whitespace-pre-wrap">
              {product.description}
            </p>
          </div>

          <SellerContactPanel
            product={product}
            isAuthenticated={isAuthenticated}
            loginHref={loginHref}
          />

          {isAuthenticated && !isOwnListing && (
            <ChatButton
              itemId={product.id}
              itemType="marketplace"
              itemTitle={product.title}
              otherPartyName={product.sellerName}
              otherPartyUserId={product.sellerId}
            />
          )}
        </div>
      </div>
    </div>
  )
}
