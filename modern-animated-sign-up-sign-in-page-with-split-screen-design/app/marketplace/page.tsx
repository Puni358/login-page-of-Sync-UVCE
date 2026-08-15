"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, Search, ShoppingBag } from "lucide-react"
import { ProductCard } from "@/components/marketplace/product-card"
import { CategoryFilter } from "@/components/marketplace/category-filter"
import { EmptyState } from "@/components/ui/empty-state"
import { CardSkeleton } from "@/components/ui/page-loader"
import { getProducts } from "@/lib/marketplace/product-service"
import { MARKETPLACE_CATEGORIES, MARKETPLACE_DISCLAIMER } from "@/lib/marketplace/constants"
import type { Product, ProductCategory } from "@/lib/marketplace/types"
import { CategoryIcon } from "@/components/marketplace/category-icon"
import { getCategoryLabel } from "@/lib/marketplace/utils"
import { useAuth } from "@/lib/auth/auth-context"

export default function MarketplacePage() {
  const { isAuthenticated } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [category, setCategory] = useState<ProductCategory | "all">("all")
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    getProducts({ category, search })
      .then(setProducts)
      .finally(() => setIsLoading(false))
  }, [category, search])

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="rounded-2xl border border-white/5 bg-gradient-to-br from-[#12121a] to-[#1a1028] p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          Campus Marketplace
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-white/50 sm:text-base">
          Buy and sell college materials — textbooks, lab kits, calculators, and small
          electronics like Arduino. Built for students, by students.
        </p>
        <p className="mt-2 text-xs text-purple-400/70">{MARKETPLACE_DISCLAIMER}</p>
        {isAuthenticated && (
          <Link
            href="/marketplace/sell"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-purple-500 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-purple-500/25 transition-all hover:bg-purple-400"
          >
            <Plus className="h-4 w-4" />
            Sell an Item
          </Link>
        )}
      </section>

      {/* Category cards */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">Categories</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {MARKETPLACE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className="group flex flex-col items-start gap-3 rounded-2xl border border-white/5 bg-[#12121a] p-4 text-left transition-all hover:border-purple-500/25 hover:shadow-[0_4px_20px_rgba(168,85,247,0.1)]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/15 text-purple-400 transition-colors group-hover:bg-purple-500/25">
                <CategoryIcon category={cat.id} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{cat.label}</p>
                <p className="mt-0.5 text-xs text-white/40 line-clamp-2">{cat.description}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Search & Filter */}
      <section className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search books, lab tools, calculators..."
            className="w-full rounded-xl border border-white/5 bg-[#12121a] py-3 pl-11 pr-4 text-sm text-white placeholder-white/30 transition-all focus:border-purple-500/70 focus:outline-none focus:ring-2 focus:ring-purple-500/25"
          />
        </div>
        <CategoryFilter selected={category} onChange={setCategory} />
      </section>

      {/* Product grid */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            {category === "all" ? "All Listings" : `${getCategoryLabel(category)} Listings`}
          </h2>
          <span className="text-sm text-white/40">
            {products.length} item{products.length !== 1 ? "s" : ""}
          </span>
        </div>

        {isLoading ? (
          <CardSkeleton count={6} />
        ) : products.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="No listings yet in this category"
            description="Check back later or list something you no longer need."
            action={
              isAuthenticated ? (
                <Link
                  href="/marketplace/sell"
                  className="inline-flex items-center gap-2 text-sm font-medium text-purple-400 hover:text-purple-300"
                >
                  <Plus className="h-4 w-4" />
                  Be the first to sell
                </Link>
              ) : (
                <Link
                  href="/?redirect=/marketplace/sell&mode=login"
                  className="text-sm font-medium text-purple-400 hover:text-purple-300"
                >
                  Login to start selling
                </Link>
              )
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
