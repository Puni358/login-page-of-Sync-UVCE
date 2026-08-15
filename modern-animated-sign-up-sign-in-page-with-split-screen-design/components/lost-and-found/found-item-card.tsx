"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, MapPin, Calendar, Trash2, Loader2, Tag, CheckCircle2 } from "lucide-react"
import type { LostFoundItem } from "@/lib/lost-and-found/types"
import { ChatButton } from "@/components/chat/chat-button"
import { useAuth } from "@/lib/auth/auth-context"
import { deleteLostFoundItem } from "@/lib/lost-and-found/found-item-service"
import { cn } from "@/lib/utils"

interface FoundItemCardProps {
  item: LostFoundItem
  onDeleteSuccess?: (id: string) => void
}

export function FoundItemCard({ item, onDeleteSuccess }: FoundItemCardProps) {
  const { user, isAdmin } = useAuth()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const isOwner = user?.id === item.listerId
  const canDelete = isOwner || isAdmin

  const hasPhoto = item.photos.length > 0
  const isLost = item.type === "lost"
  const isResolved = item.status === "resolved"

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteLostFoundItem(item.id)
      onDeleteSuccess?.(item.id)
    } catch (err) {
      console.error("Failed to delete item:", err)
      alert("Failed to delete listing. Please try again.")
    } finally {
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  const formattedDate = item.createdAt
    ? new Date(item.createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : ""

  return (
    <div
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#12121a] transition-all hover:border-purple-500/25 hover:shadow-[0_8px_32px_rgba(168,85,247,0.12)]",
        isResolved && "opacity-75 hover:opacity-100 border-emerald-500/20"
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#1a1a26]">
        <Link href={`/lost-and-found/${item.id}`} className="block h-full w-full">
          {hasPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.photos[0]}
              alt={item.title}
              className={cn(
                "h-full w-full object-cover transition-transform group-hover:scale-105",
                isResolved && "grayscale-[25%]"
              )}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-white/30">
              No photo
            </div>
          )}
        </Link>

        {/* Type Badge */}
        <div
          className={cn(
            "absolute left-3 top-3 rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider backdrop-blur-md border shadow-md",
            isLost
              ? "bg-amber-950/80 text-amber-300 border-amber-500/40"
              : "bg-purple-950/80 text-purple-300 border-purple-500/40"
          )}
        >
          {isLost ? "Lost Item" : "Found Item"}
        </div>

        {/* Resolved Badge */}
        {isResolved && (
          <div className="absolute left-3 bottom-3 inline-flex items-center gap-1 rounded-lg bg-emerald-600/90 px-2.5 py-1 text-[11px] font-bold text-white shadow-lg backdrop-blur-md border border-emerald-400/30">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-200" />
            <span>✓ Resolved</span>
          </div>
        )}

        {/* Delete Button for Owner or Admin */}
        {canDelete && (
          <div className="absolute right-3 top-3 z-10">
            {showConfirm ? (
              <div className="flex items-center gap-1.5 rounded-xl bg-black/90 p-1.5 backdrop-blur-md border border-white/10">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="rounded-lg bg-red-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-red-500 disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Confirm"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="rounded-lg bg-white/10 px-2 py-1 text-[11px] text-white/70 hover:bg-white/20"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/60 text-red-400 backdrop-blur-md border border-white/10 transition-colors hover:bg-red-500 hover:text-white"
                title="Delete listing"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      <Link href={`/lost-and-found/${item.id}`} className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-base font-semibold text-white group-hover:text-purple-300 transition-colors">
            {item.title}
          </h3>
        </div>

        {item.category && item.category !== "general" && (
          <div className="mt-1 flex items-center gap-1 text-[11px] text-purple-400/80">
            <Tag className="h-3 w-3" />
            <span className="capitalize">{item.category.replace(/-/g, " ")}</span>
          </div>
        )}

        {item.description ? (
          <p className="mt-1.5 line-clamp-2 text-sm text-white/45">{item.description}</p>
        ) : (
          <p className="mt-1.5 text-xs italic text-white/25">No description provided</p>
        )}

        <div className="mt-3 space-y-1.5 text-xs text-white/40">
          <p className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-purple-400/70" />
            <span className="line-clamp-1">{item.location}</span>
          </p>
          {formattedDate && (
            <p className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-purple-400/70" />
              <span>{formattedDate}</span>
            </p>
          )}
        </div>

        <div className="mt-3 flex items-center gap-1 text-xs font-medium text-purple-400 opacity-0 transition-opacity group-hover:opacity-100">
          View details
          <ArrowRight className="h-3 w-3" />
        </div>
      </Link>

      <div className="border-t border-white/5 px-4 py-3">
        <ChatButton
          itemId={item.id}
          itemType="lost-found"
          itemTitle={item.title}
          otherPartyName={item.listerName}
          otherPartyUserId={item.listerId}
          variant="compact"
          className="w-full justify-center py-2"
        />
      </div>
    </div>
  )
}
