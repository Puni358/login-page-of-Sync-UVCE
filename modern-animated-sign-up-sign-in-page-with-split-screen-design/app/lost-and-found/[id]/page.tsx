"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Calendar, CheckCircle2, MapPin, Tag, Trash2, Loader2 } from "lucide-react"
import { ListerContactPanel } from "@/components/lost-and-found/lister-contact-panel"
import { ChatButton } from "@/components/chat/chat-button"
import { getLostFoundItemById, deleteLostFoundItem } from "@/lib/lost-and-found/found-item-service"
import { updateItemStatus } from "@/lib/marketplace/product-service"
import type { LostFoundItem } from "@/lib/lost-and-found/types"
import { useAuth } from "@/lib/auth/auth-context"
import { cn } from "@/lib/utils"

export default function LostFoundItemDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isAuthenticated, isAdmin } = useAuth()
  const [item, setItem] = useState<LostFoundItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activePhoto, setActivePhoto] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const itemId = params.id as string
  const loginHref = `/?redirect=${encodeURIComponent(`/lost-and-found/${itemId}`)}&mode=login`

  useEffect(() => {
    getLostFoundItemById(itemId).then(setItem).finally(() => setIsLoading(false))
  }, [itemId])

  const isOwner = user?.id === item?.listerId
  const canManage = isOwner || isAdmin

  const handleDelete = async () => {
    if (!item) return
    setIsDeleting(true)
    try {
      await deleteLostFoundItem(item.id)
      router.push("/lost-and-found")
    } catch (err) {
      console.error("Failed to delete listing:", err)
      alert("Failed to delete listing. Please try again.")
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  const handleToggleResolvedStatus = async () => {
    if (!item) return
    const newStatus = item.status === "resolved" ? "active" : "resolved"
    setIsUpdatingStatus(true)
    try {
      const success = await updateItemStatus(item.id, newStatus)
      if (success) {
        setItem((prev) => (prev ? { ...prev, status: newStatus } : null))
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
    return <div className="h-96 animate-pulse rounded-2xl bg-white/5" />
  }

  if (!item) {
    return (
      <div className="rounded-2xl border border-white/5 bg-[#12121a] px-6 py-16 text-center">
        <p className="text-white/50">Item not found.</p>
        <Link href="/lost-and-found" className="mt-4 inline-flex items-center gap-2 text-sm text-purple-400">
          <ArrowLeft className="h-4 w-4" /> Back to Lost &amp; Found
        </Link>
      </div>
    )
  }

  const isLost = item.type === "lost"
  const isResolved = item.status === "resolved"
  const formattedDate = item.createdAt
    ? new Date(item.createdAt).toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : ""

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/lost-and-found" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to Lost &amp; Found
        </Link>

        {canManage && (
          <div className="flex items-center gap-2">
            {/* Mark as Resolved button */}
            <button
              type="button"
              onClick={handleToggleResolvedStatus}
              disabled={isUpdatingStatus}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all disabled:opacity-50 ${
                isResolved
                  ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
              }`}
            >
              {isUpdatingStatus ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              )}
              {isResolved ? "Mark as Active" : "Mark as Resolved"}
            </button>

            {showConfirm ? (
              <div className="flex items-center gap-2 rounded-xl bg-[#12121a] p-2 border border-white/10">
                <span className="text-xs text-white/70">Delete item?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50 flex items-center gap-1"
                >
                  {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Yes, Delete"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="rounded-lg bg-white/10 px-2.5 py-1.5 text-xs text-white/70 hover:bg-white/20"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-all"
              >
                <Trash2 className="h-4 w-4" />
                Delete Listing
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/5 bg-[#1a1a26]">
            {item.photos.length > 0 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.photos[activePhoto]}
                alt={item.title}
                className={cn("h-full w-full object-cover", isResolved && "grayscale-[20%]")}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-white/30">No photo</div>
            )}
            <div
              className={cn(
                "absolute left-4 top-4 rounded-xl px-3 py-1.5 text-xs font-bold uppercase tracking-wider backdrop-blur-md border shadow-lg",
                isLost
                  ? "bg-amber-950/80 text-amber-300 border-amber-500/40"
                  : "bg-purple-950/80 text-purple-300 border-purple-500/40"
              )}
            >
              {isLost ? "Lost Item" : "Found Item"}
            </div>

            {isResolved && (
              <div className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600/90 px-3 py-1.5 text-xs font-bold text-white shadow-xl backdrop-blur-md border border-emerald-400/40">
                <CheckCircle2 className="h-4 w-4 text-emerald-200" />
                <span>✓ Resolved</span>
              </div>
            )}
          </div>
          {item.photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {item.photos.map((photo, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActivePhoto(i)}
                  className={cn(
                    "h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all",
                    activePhoto === i ? "border-purple-500 shadow-md shadow-purple-500/20 scale-105" : "border-white/10 opacity-70 hover:opacity-100"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide",
                  isLost ? "bg-amber-500/20 text-amber-300" : "bg-purple-500/20 text-purple-300"
                )}
              >
                {isLost ? "Reported Lost" : "Reported Found"}
              </span>
              {item.category && item.category !== "general" && (
                <span className="flex items-center gap-1 rounded-md bg-white/5 px-2 py-0.5 text-[11px] text-white/60">
                  <Tag className="h-3 w-3" />
                  <span className="capitalize">{item.category.replace(/-/g, " ")}</span>
                </span>
              )}
              {isResolved && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="h-3.5 w-3.5" /> ✓ Resolved
                </span>
              )}
            </div>

            <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">{item.title}</h1>
            <div className="mt-4 space-y-2 text-sm text-white/60">
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-purple-400 shrink-0" />
                <span>Location: <strong className="text-white">{item.location}</strong></span>
              </p>
              {formattedDate && (
                <p className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-400 shrink-0" />
                  <span>Reported on: <strong className="text-white">{formattedDate}</strong></span>
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#12121a] p-5">
            <h2 className="mb-2 text-sm font-semibold text-white/70">Description</h2>
            {item.description ? (
              <p className="text-sm leading-relaxed text-white/80 whitespace-pre-wrap">{item.description}</p>
            ) : (
              <p className="text-sm italic text-white/30">No description provided for this item.</p>
            )}
          </div>

          <ListerContactPanel
            listerName={item.listerName}
            listerEmail={item.listerEmail}
            listerPhone={item.listerPhone}
            isAuthenticated={isAuthenticated}
            loginHref={loginHref}
          />

          {isAuthenticated && (
            <ChatButton
              itemId={item.id}
              itemType="lost-found"
              itemTitle={item.title}
              otherPartyName={item.listerName}
              otherPartyUserId={item.listerId}
            />
          )}
        </div>
      </div>
    </div>
  )
}
