import type { ProductCategory } from "@/lib/marketplace/types"

export type LostFoundType = "lost" | "found"

export type LostFoundItem = {
  id: string
  type: LostFoundType
  title: string
  description?: string
  photos: string[]
  imageUrl?: string | null
  location: string
  category?: ProductCategory
  listerId: string
  listerName: string
  listerEmail: string
  listerPhone: string
  createdAt: string
  status?: string
}

// Alias for backward compatibility
export type FoundItem = LostFoundItem

export type CreateLostFoundItemInput = {
  type: LostFoundType
  title: string
  description?: string
  photos?: string[]
  imageUrl?: string | null
  location: string
  category?: ProductCategory
  listerEmail?: string
  listerPhone?: string
}

// Alias for backward compatibility
export type CreateFoundItemInput = CreateLostFoundItemInput

export type LostFoundFilters = {
  type?: LostFoundType | "all"
  category?: ProductCategory | "all"
  search?: string
}
