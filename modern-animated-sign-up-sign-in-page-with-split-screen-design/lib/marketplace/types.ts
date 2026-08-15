export type ProductCategory =
  | "books"
  | "lab-tools"
  | "calculators"
  | "small-electronics"

export type ProductCondition = "excellent" | "good" | "moderate" | "fair" | "needs-repair"

export interface Seller {
  id: string
  name: string
  email: string
  phone: string
}

export interface Product {
  id: string
  title: string
  description: string
  category: ProductCategory
  condition: ProductCondition
  photos: string[]
  sellerId: string
  sellerName: string
  sellerEmail: string
  sellerPhone: string
  createdAt: string
  updatedAt: string
}

export interface CreateProductInput {
  title: string
  description: string
  category: ProductCategory
  condition: ProductCondition
  photos: string[]
  sellerEmail: string
  sellerPhone: string
}

export interface ProductFilters {
  category?: ProductCategory | "all"
  search?: string
}
