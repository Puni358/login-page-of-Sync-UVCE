import type { CreateProductInput, Product, ProductFilters } from "./types"

const STORAGE_KEY = "nova_marketplace_products"

/**
 * Local persistence layer — replace method bodies with API calls when backend is ready.
 * Example: return fetch('/api/products').then(r => r.json())
 */
function readProducts(): Product[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Product[]) : []
  } catch {
    return []
  }
}

function writeProducts(products: Product[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
}

function generateId(): string {
  return `prod_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export async function getProducts(filters?: ProductFilters): Promise<Product[]> {
  // TODO: replace with GET /api/marketplace/products
  let products = readProducts().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  if (filters?.category && filters.category !== "all") {
    products = products.filter((p) => p.category === filters.category)
  }

  if (filters?.search?.trim()) {
    const q = filters.search.trim().toLowerCase()
    products = products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    )
  }

  return products
}

export async function getProductById(id: string): Promise<Product | null> {
  // TODO: replace with GET /api/marketplace/products/:id
  const products = readProducts()
  return products.find((p) => p.id === id) ?? null
}

export async function createProduct(
  input: CreateProductInput,
  seller: { id: string; name: string }
): Promise<Product> {
  // TODO: replace with POST /api/marketplace/products (multipart for photos)
  const now = new Date().toISOString()
  const product: Product = {
    id: generateId(),
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category,
    condition: input.condition,
    photos: input.photos,
    sellerId: seller.id,
    sellerName: seller.name,
    sellerEmail: input.sellerEmail.trim(),
    sellerPhone: input.sellerPhone.trim(),
    createdAt: now,
    updatedAt: now,
  }

  const products = readProducts()
  products.unshift(product)
  writeProducts(products)
  return product
}

export async function deleteProduct(id: string, sellerId: string): Promise<boolean> {
  // TODO: replace with DELETE /api/marketplace/products/:id
  const products = readProducts()
  const index = products.findIndex((p) => p.id === id && p.sellerId === sellerId)
  if (index === -1) return false
  products.splice(index, 1)
  writeProducts(products)
  return true
}
