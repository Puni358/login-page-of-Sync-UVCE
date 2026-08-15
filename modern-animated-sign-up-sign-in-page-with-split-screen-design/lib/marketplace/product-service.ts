import { supabase } from "@/lib/supabaseClient"
import type { CreateProductInput, ItemRow, Product, ProductFilters } from "./types"

const ITEM_SELECT = `
  id,
  user_id,
  type,
  title,
  description,
  price,
  image_url,
  location,
  status,
  created_at,
  profiles:user_id (
    full_name,
    email,
    phone_number
  )
`

function mapItemToProduct(row: ItemRow): Product {
  const rawProfile = row.profiles
  const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile
  const imageUrl = row.image_url

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    price: row.price,
    location: row.location ?? "",
    imageUrl,
    photos: imageUrl ? [imageUrl] : [],
    sellerId: row.user_id,
    sellerName: profile?.full_name?.trim() || "Seller",
    sellerEmail: profile?.email ?? "",
    sellerPhone: profile?.phone_number ?? "",
    createdAt: row.created_at,
  }
}

function applyClientFilters(products: Product[], filters?: ProductFilters): Product[] {
  let result = products

  if (filters?.category && filters.category !== "all") {
    const label = filters.category.replace(/-/g, " ")
    result = result.filter(
      (p) =>
        p.title.toLowerCase().includes(label) ||
        p.description.toLowerCase().includes(label) ||
        p.category === filters.category
    )
  }

  if (filters?.search?.trim()) {
    const q = filters.search.trim().toLowerCase()
    result = result.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q)
    )
  }

  return result
}

export async function getProducts(filters?: ProductFilters): Promise<Product[]> {
  let { data, error } = await supabase
    .from("items")
    .select(ITEM_SELECT)
    .eq("type", "market")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Failed to fetch marketplace items with profile join, trying fallback:", error.message)
    const fallback = await supabase
      .from("items")
      .select("*")
      .eq("type", "market")
      .order("created_at", { ascending: false })

    if (fallback.error) {
      console.error("Failed to fetch marketplace items:", fallback.error.message)
      return []
    }
    data = fallback.data
  }

  const products = ((data || []) as unknown as ItemRow[]).map(mapItemToProduct)
  return applyClientFilters(products, filters)
}

export async function getProductById(id: string): Promise<Product | null> {
  let { data, error } = await supabase
    .from("items")
    .select(ITEM_SELECT)
    .eq("id", id)
    .eq("type", "market")
    .maybeSingle()

  if (error) {
    console.error("Failed to fetch marketplace item with profile join, trying fallback:", error.message)
    const fallback = await supabase
      .from("items")
      .select("*")
      .eq("id", id)
      .eq("type", "market")
      .maybeSingle()

    if (fallback.error || !fallback.data) {
      console.error("Failed to fetch marketplace item:", fallback.error?.message)
      return null
    }
    data = fallback.data
  }

  if (!data) return null
  return mapItemToProduct(data as unknown as ItemRow)
}

export async function createProduct(
  input: CreateProductInput,
  userId: string
): Promise<Product> {
  const { data, error } = await supabase
    .from("items")
    .insert({
      user_id: userId,
      type: "market",
      title: input.title.trim(),
      description: input.description.trim(),
      price: input.price,
      image_url: input.imageUrl,
      location: input.location.trim(),
      status: "active",
    })
    .select(ITEM_SELECT)
    .single()

  if (error) {
    console.error("Error creating product with profile join, trying fallback:", error.message)
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("items")
      .insert({
        user_id: userId,
        type: "market",
        title: input.title.trim(),
        description: input.description.trim(),
        price: input.price,
        image_url: input.imageUrl,
        location: input.location.trim(),
        status: "active",
      })
      .select("*")
      .single()

    if (fallbackError || !fallbackData) {
      throw new Error(error.message || fallbackError?.message || "Failed to list item")
    }
    return mapItemToProduct(fallbackData as unknown as ItemRow)
  }

  return mapItemToProduct(data as unknown as ItemRow)
}

export async function deleteProduct(id: string, userId: string): Promise<boolean> {
  const { error, count } = await supabase
    .from("items")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("user_id", userId)
    .eq("type", "market")

  if (error) {
    console.error("Failed to delete marketplace item:", error.message)
    return false
  }

  return (count ?? 0) > 0
}

