export type ProductCategory =
  | "books"
  | "lab-tools"
  | "calculators"
  | "small-electronics"

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
}

export interface CreateProductInput {
  title: string
  description: string
  price: number
  location: string
  imageUrl: string | null
}

export interface ProductFilters {
  category?: ProductCategory | "all"
  search?: string
}

export interface ItemRow {
  id: string
  user_id: string
  type: string
  title: string
  description: string
  price: number
  image_url: string | null
  location: string | null
  status: string
  created_at: string
  profiles: {
    full_name: string | null
    email: string | null
    phone_number: string | null
  } | null
}
