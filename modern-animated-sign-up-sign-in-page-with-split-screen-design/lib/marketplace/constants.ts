import type { ProductCategory, ProductCondition } from "./types"

export const MARKETPLACE_CATEGORIES: {
  id: ProductCategory
  label: string
  description: string
}[] = [
  {
    id: "books",
    label: "Books",
    description: "Textbooks, reference books, and study materials",
  },
  {
    id: "lab-tools",
    label: "Lab Tools",
    description: "Lab kits, glassware, and experiment equipment",
  },
  {
    id: "calculators",
    label: "Calculators",
    description: "Scientific and graphing calculators",
  },
  {
    id: "small-electronics",
    label: "Small Electronics",
    description: "Arduino, sensors, and low-cost project components",
  },
]

export const PRODUCT_CONDITIONS: {
  value: ProductCondition
  label: string
}[] = [
  { value: "excellent", label: "Excellent — like new" },
  { value: "good", label: "Good — minor wear" },
  { value: "moderate", label: "Moderate — visible use" },
  { value: "fair", label: "Fair — functional with wear" },
  { value: "needs-repair", label: "Needs repair" },
]

export const ALLOWED_CATEGORIES = MARKETPLACE_CATEGORIES.map((c) => c.id)

export const MAX_PRODUCT_PHOTOS = 5
export const MAX_PHOTO_SIZE_MB = 5

export const MARKETPLACE_DISCLAIMER =
  "Student marketplace for college materials only. No clothing, bags, laptops, or high-value items."
