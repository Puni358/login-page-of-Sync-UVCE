"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, Calendar, MapPin } from "lucide-react"
import { ListerContactPanel } from "@/components/lost-and-found/lister-contact-panel"
import { ChatButton } from "@/components/chat/chat-button"
import { getFoundItemById } from "@/lib/lost-and-found/found-item-service"
import type { FoundItem } from "@/lib/lost-and-found/types"
import { useAuth } from "@/lib/auth/auth-context"

export default function FoundItemDetailPage() {
  const params = useParams()
  const { isAuthenticated } = useAuth()
  const [item, setItem] = useState<FoundItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activePhoto, setActivePhoto] = useState(0)

  const itemId = params.id as string
  const loginHref = `/?redirect=${encodeURIComponent(`/lost-and-found/${itemId}`)}&mode=login`

  useEffect(() => {
    getFoundItemById(itemId).then(setItem).finally(() => setIsLoading(false))
  }, [itemId])

  if (isLoading) {
    return <div className="h-96 animate-pulse rounded-2xl bg-white/5" />
  }

  if (!item) {
    return (
      <div className="rounded-2xl border border-white/5 bg-[#12121a] px-6 py-16 text-center">
        <p className="text-white/50">Item not found.</p>
        <Link href="/lost-and-found" className="mt-4 inline-flex items-center gap-2 text-sm text-purple-400">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link href="/lost-and-found" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to Lost &amp; Found
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/5 bg-[#1a1a26]">
            {item.photos.length > 0 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.photos[activePhoto]} alt={item.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-white/30">No photo</div>
            )}
          </div>
          {item.photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {item.photos.map((photo, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActivePhoto(i)}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${activePhoto === i ? "border-purple-500" : "border-white/10"}`}
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
            <h1 className="text-2xl font-bold text-white sm:text-3xl">{item.title}</h1>
            <div className="mt-3 space-y-2 text-sm text-white/50">
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-purple-400" />
                Found at: <span className="text-white/80">{item.foundWhere}</span>
              </p>
              <p className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-400" />
                When: <span className="text-white/80">{item.foundWhen}</span>
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#12121a] p-5">
            <h2 className="mb-2 text-sm font-medium text-white/60">Description</h2>
            <p className="text-sm leading-relaxed text-white/80 whitespace-pre-wrap">{item.description}</p>
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
