"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle2, MapPin, Trash2, Loader2 } from "lucide-react"
import { SellerContactPanel } from "@/components/marketplace/seller-contact-panel"
import { ChatButton } from "@/components/chat/chat-button"
import {
  getProductById,
  deleteProduct,
  adminDeleteProduct,
  updateItemStatus,
} from "@/lib/marketplace/product-service"
import type { Product } from "@/lib/marketplace/types"
import { formatDate, formatPrice } from "@/lib/marketplace/utils"
import { useAuth } from "@/lib/auth/auth-context"

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated, user, isAdmin } = useAuth()
  const [product, setProduct] = useState<Product | null>(null)
  const [activePhotoIndex, setActivePhotoIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  const productId = params.id as string
  const loginHref = `/?redirect=${encodeURIComponent(`/marketplace/${productId}`)}&mode=login`

  useEffect(() => {
    getProductById(productId)
      .then(setProduct)
      .finally(() => setIsLoading(false))
  }, [productId])

  const isOwnListing = user?.id === product?.sellerId
  const canManage = isOwnListing || isAdmin

  const handleDelete = async () => {
    if (!product || !user) return
    const confirmMessage =
      isAdmin && !isOwnListing
        ? "As an Admin, are you sure you want to delete this listing for moderation?"
        : "Are you sure you want to delete your listing?"

    if (!window.confirm(confirmMessage)) return

    setIsDeleting(true)
    try {
      const success =
        isAdmin && !isOwnListing
          ? await adminDeleteProduct(product.id)
          : await deleteProduct(product.id, user.id)

      if (success) {
        router.push("/marketplace")
      } else {
        alert("Failed to delete listing. Please try again.")
      }
    } catch {
      alert("Error deleting listing.")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggleSoldStatus = async () => {
    if (!product) return
    const newStatus = product.status === "sold" ? "active" : "sold"
    setIsUpdatingStatus(true)
    try {
      const success = await updateItemStatus(product.id, newStatus)
      if (success) {
        setProduct((prev) => (prev ? { ...prev, status: newStatus } : null))
      } else {
        alert("Failed to update status. Please try again.")
      }
    } catch (err) {
      console.error("Error updating status:", err)
      alert("Error updating status.")
    } finally {
      setIsUpdatingStatus(false)
    }
  }

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

  const photos =
    product.photos.length > 0 ? product.photos : product.imageUrl ? [product.imageUrl] : []
  const currentPhoto = photos[activePhotoIndex] || photos[0]
  const isSold = product.status === "sold"

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to marketplace
        </Link>

        {canManage && (
          <div className="flex items-center gap-2">
            {/* Mark as Sold button */}
            <button
              type="button"
              onClick={handleToggleSoldStatus}
              disabled={isUpdatingStatus}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all disabled:opacity-50 ${
                isSold
                  ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
              }`}
            >
              {isUpdatingStatus ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              )}
              {isSold ? "Mark as Active" : "Mark as Sold"}
            </button>

            {/* Delete button */}
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
            >
              {isDeleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              Delete Listing
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Photos Gallery */}
        <div className="space-y-3">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/5 bg-[#1a1a26]">
            {currentPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentPhoto}
                alt={product.title}
                className={`h-full w-full object-cover ${isSold ? "grayscale-[20%]" : ""}`}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-white/30">
                No photo available
              </div>
            )}

            {isSold && (
              <div className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600/90 px-3 py-1.5 text-xs font-bold text-white shadow-xl backdrop-blur-md border border-emerald-400/40">
                <CheckCircle2 className="h-4 w-4 text-emerald-200" />
                <span>✓ Sold</span>
              </div>
            )}
          </div>

          {photos.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {photos.map((photo, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActivePhotoIndex(idx)}
                  className={`relative aspect-square w-16 overflow-hidden rounded-xl border transition-all ${
                    idx === activePhotoIndex
                      ? "border-purple-500 ring-2 ring-purple-500/30"
                      : "border-white/10 opacity-60 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
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
              {isSold && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="h-3.5 w-3.5" /> ✓ Sold
                </span>
              )}
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
