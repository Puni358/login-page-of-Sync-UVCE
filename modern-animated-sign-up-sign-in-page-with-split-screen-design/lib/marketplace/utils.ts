import type { ProductCategory } from "./types"

export function getCategoryLabel(category: ProductCategory): string {
  const labels: Record<ProductCategory, string> = {
    books: "Books",
    "lab-tools": "Lab Tools",
    calculators: "Calculators",
    "small-electronics": "Small Electronics",
  }
  return labels[category]
}

export function formatCondition(condition: string): string {
  return condition
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price)
}
