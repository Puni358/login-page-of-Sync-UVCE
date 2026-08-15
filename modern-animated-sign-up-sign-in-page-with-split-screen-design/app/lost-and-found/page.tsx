"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, Search, MapPin } from "lucide-react"
import { FoundItemCard } from "@/components/lost-and-found/found-item-card"
import { EmptyState } from "@/components/ui/empty-state"
import { CardSkeleton } from "@/components/ui/page-loader"
import { getFoundItems } from "@/lib/lost-and-found/found-item-service"
import type { FoundItem } from "@/lib/lost-and-found/types"
import { useAuth } from "@/lib/auth/auth-context"

export default function LostAndFoundPage() {
  const { isAuthenticated } = useAuth()
  const [items, setItems] = useState<FoundItem[]>([])
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    getFoundItems(search).then(setItems).finally(() => setIsLoading(false))
  }, [search])

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-white/5 bg-gradient-to-br from-[#12121a] to-[#1a1028] p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Lost &amp; Found</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/50 sm:text-base">
          Browse items found on campus. If something is yours, login to contact the person who listed it.
        </p>
        {isAuthenticated ? (
          <Link
            href="/lost-and-found/list"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-purple-500 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-purple-500/25 hover:bg-purple-400"
          >
            <Plus className="h-4 w-4" />
            List a Found Item
          </Link>
        ) : (
          <Link
            href="/?redirect=/lost-and-found/list&mode=login"
            className="mt-5 inline-block text-sm font-medium text-purple-400 hover:text-purple-300"
          >
            Login to list a found item
          </Link>
        )}
      </section>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by item, location, or description..."
          className="w-full rounded-xl border border-white/5 bg-[#12121a] py-3 pl-11 pr-4 text-sm text-white placeholder-white/30 focus:border-purple-500/70 focus:outline-none focus:ring-2 focus:ring-purple-500/25"
        />
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Found Items</h2>
          <span className="text-sm text-white/40">{items.length} item{items.length !== 1 ? "s" : ""}</span>
        </div>

        {isLoading ? (
          <CardSkeleton count={3} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="No found items listed yet"
            description="Found something on campus? List it to help reunite it with its owner."
            action={
              isAuthenticated ? (
                <Link
                  href="/lost-and-found/list"
                  className="inline-flex items-center gap-2 text-sm font-medium text-purple-400 hover:text-purple-300"
                >
                  <Plus className="h-4 w-4" />
                  List a found item
                </Link>
              ) : (
                <Link
                  href="/?redirect=/lost-and-found/list&mode=login"
                  className="text-sm font-medium text-purple-400 hover:text-purple-300"
                >
                  Login to list a found item
                </Link>
              )
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <FoundItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
