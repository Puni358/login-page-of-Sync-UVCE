export type ProductCategory =
  | "books"
  | "lab-tools"
  | "calculators"
  | "small-electronics"
  | "general"

export type ProductCondition = "excellent" | "good" | "moderate" | "fair" | "needs-repair"

export interface Product {
  id: string
  title: string
  description: string
  price: number
  location: string
  imageUrl: string | null
  photos: string[]
  sellerId: string
  sellerName: string
  sellerEmail: string
  sellerPhone: string
  createdAt: string
  category?: ProductCategory
  condition?: ProductCondition
  status?: string
}

export interface CreateProductInput {
  title: string
  description?: string
  price: number
  location: string
  imageUrl?: string | null
  photos?: string[]
  sellerEmail?: string
  sellerPhone?: string
  category?: ProductCategory
  condition?: ProductCondition
}

export interface ProductFilters {
  category?: ProductCategory | "all"
  search?: string
}

export interface ItemRow {
  id: string
  user_id: string
  type: string
  category?: string | null
  title: string
  description?: string | null
  price: number
  image_url: string | null
  location: string | null
  status: string
  created_at: string
  item_images?: Array<{
    id?: string
    image_url?: string
    url?: string
    image?: string
  }>
  profiles: {
    full_name: string | null
    email: string | null
    phone_number: string | null
  } | null
}

