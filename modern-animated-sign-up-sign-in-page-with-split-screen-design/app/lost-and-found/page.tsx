"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, Search, MapPin, Tag } from "lucide-react"
import { FoundItemCard } from "@/components/lost-and-found/found-item-card"
import { EmptyState } from "@/components/ui/empty-state"
import { CardSkeleton } from "@/components/ui/page-loader"
import { getLostFoundItems } from "@/lib/lost-and-found/found-item-service"
import type { LostFoundItem, LostFoundType } from "@/lib/lost-and-found/types"
import type { ProductCategory } from "@/lib/marketplace/types"
import { MARKETPLACE_CATEGORIES } from "@/lib/marketplace/constants"
import { useAuth } from "@/lib/auth/auth-context"
import { cn } from "@/lib/utils"

export default function LostAndFoundPage() {
  const { isAuthenticated } = useAuth()
  const [items, setItems] = useState<LostFoundItem[]>([])
  const [typeFilter, setTypeFilter] = useState<LostFoundType | "all">("all")
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | "all">("all")
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  const fetchItems = () => {
    setIsLoading(true)
    getLostFoundItems({ type: typeFilter, category: categoryFilter, search })
      .then(setItems)
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    fetchItems()
  }, [typeFilter, categoryFilter, search])

  const handleDeleteSuccess = (deletedId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== deletedId))
  }

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <section className="rounded-2xl border border-white/5 bg-gradient-to-br from-[#12121a] to-[#1a1028] p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Lost &amp; Found</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/50 sm:text-base">
          Browse lost and found items on campus. If something is yours, login to contact the person who listed it or report an item you lost/found.
        </p>
        {isAuthenticated ? (
          <Link
            href="/lost-and-found/list"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-purple-500 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-purple-500/25 transition-all hover:bg-purple-400"
          >
            <Plus className="h-4 w-4" />
            Report Lost or Found Item
          </Link>
        ) : (
          <Link
            href="/?redirect=/lost-and-found/list&mode=login"
            className="mt-5 inline-block text-sm font-medium text-purple-400 hover:text-purple-300"
          >
            Login to report a lost/found item
          </Link>
        )}
      </section>

      {/* Type & Category Filter Controls */}
      <section className="space-y-4">
        {/* Type Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setTypeFilter("all")}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-medium transition-all border",
              typeFilter === "all"
                ? "bg-purple-500 text-white border-purple-500 shadow-md shadow-purple-500/20"
                : "bg-[#12121a] text-white/60 border-white/5 hover:border-white/10 hover:text-white"
            )}
          >
            All Items
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter("lost")}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-medium transition-all border",
              typeFilter === "lost"
                ? "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20"
                : "bg-[#12121a] text-amber-400/70 border-white/5 hover:border-amber-500/30 hover:text-amber-300"
            )}
          >
            Lost Items
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter("found")}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-medium transition-all border",
              typeFilter === "found"
                ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20"
                : "bg-[#12121a] text-purple-400/70 border-white/5 hover:border-purple-500/30 hover:text-purple-300"
            )}
          >
            Found Items
          </button>
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setCategoryFilter("all")}
            className={cn(
              "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-all border",
              categoryFilter === "all"
                ? "bg-white/15 text-white border-white/20"
                : "bg-[#12121a] text-white/40 border-white/5 hover:text-white/80"
            )}
          >
            All Categories
          </button>
          {MARKETPLACE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(categoryFilter === cat.id ? "all" : cat.id)}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-all border flex items-center gap-1.5",
                categoryFilter === cat.id
                  ? "bg-purple-500/20 text-purple-300 border-purple-500/50"
                  : "bg-[#12121a] text-white/40 border-white/5 hover:text-white/80"
              )}
            >
              <Tag className="h-3 w-3" />
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by item name, location, or description..."
            className="w-full rounded-xl border border-white/5 bg-[#12121a] py-3 pl-11 pr-4 text-sm text-white placeholder-white/30 transition-all focus:border-purple-500/70 focus:outline-none focus:ring-2 focus:ring-purple-500/25"
          />
        </div>
      </section>

      {/* Item Grid & States */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            {typeFilter === "lost"
              ? "Lost Items"
              : typeFilter === "found"
              ? "Found Items"
              : "All Lost & Found Items"}
          </h2>
          <span className="text-sm text-white/40">
            {items.length} item{items.length !== 1 ? "s" : ""}
          </span>
        </div>

        {isLoading ? (
          <CardSkeleton count={3} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="No items found"
            description={
              search || typeFilter !== "all" || categoryFilter !== "all"
                ? "No lost or found items match your selected filters."
                : "No lost or found items listed yet. Be the first to report an item!"
            }
            action={
              isAuthenticated ? (
                <Link
                  href="/lost-and-found/list"
                  className="inline-flex items-center gap-2 text-sm font-medium text-purple-400 hover:text-purple-300"
                >
                  <Plus className="h-4 w-4" />
                  Report a lost or found item
                </Link>
              ) : (
                <Link
                  href="/?redirect=/lost-and-found/list&mode=login"
                  className="text-sm font-medium text-purple-400 hover:text-purple-300"
                >
                  Login to report an item
                </Link>
              )
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <FoundItemCard
                key={item.id}
                item={item}
                onDeleteSuccess={handleDeleteSuccess}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
