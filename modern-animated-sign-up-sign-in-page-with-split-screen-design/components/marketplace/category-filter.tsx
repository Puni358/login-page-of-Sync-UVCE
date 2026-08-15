"use client"

import { cn } from "@/lib/utils"
import type { ProductCategory } from "@/lib/marketplace/types"
import { MARKETPLACE_CATEGORIES } from "@/lib/marketplace/constants"
import { CategoryIcon } from "@/components/marketplace/category-icon"

interface CategoryFilterProps {
  selected: ProductCategory | "all"
  onChange: (category: ProductCategory | "all") => void
}

export function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onChange("all")}
        className={cn(
          "rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300",
          selected === "all"
            ? "bg-purple-500 text-white shadow-lg shadow-purple-500/25"
            : "border border-white/5 bg-[#1a1a26] text-white/60 hover:border-purple-500/25 hover:text-white"
        )}
      >
        All Items
      </button>
      {MARKETPLACE_CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => onChange(cat.id)}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300",
            selected === cat.id
              ? "bg-purple-500 text-white shadow-lg shadow-purple-500/25"
              : "border border-white/5 bg-[#1a1a26] text-white/60 hover:border-purple-500/25 hover:text-white"
          )}
        >
          <CategoryIcon category={cat.id} className="w-4 h-4" />
          {cat.label}
        </button>
      ))}
    </div>
  )
}
