import { supabase } from "@/lib/supabaseClient"
import type { CreateProductInput, ItemRow, Product, ProductFilters } from "./types"

const ITEM_SELECT_PUBLIC = `
  id,
  user_id,
  type,
  category,
  title,
  description,
  price,
  image_url,
  location,
  status,
  created_at,
  item_images (
    id,
    image_url
  ),
  public_profiles:user_id (
    full_name
  )
`

const ITEM_SELECT = `
  id,
  user_id,
  type,
  category,
  title,
  description,
  price,
  image_url,
  location,
  status,
  created_at,
  item_images (
    id,
    image_url
  ),
  profiles:user_id (
    full_name,
    email,
    phone_number
  )
`

function mapItemToProduct(row: ItemRow): Product {
  const rawProfile = row.profiles ?? (row as any).public_profiles
  const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile
  const mainImageUrl = row.image_url

  let photos: string[] = []
  if (row.item_images && Array.isArray(row.item_images) && row.item_images.length > 0) {
    photos = row.item_images
      .map((img) => img.image_url || img.url || img.image)
      .filter((u): u is string => Boolean(u))
  }
  if (photos.length === 0 && mainImageUrl) {
    photos = [mainImageUrl]
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    price: row.price,
    location: row.location ?? "",
    category: (row.category as any) || undefined,
    imageUrl: photos[0] ?? mainImageUrl ?? null,
    photos,
    sellerId: row.user_id,
    sellerName: profile?.full_name?.trim() || "Seller",
    sellerEmail: profile?.email ?? "",
    sellerPhone: profile?.phone_number ?? "",
    createdAt: row.created_at,
    status: row.status ?? "active",
  }
}

export async function updateItemStatus(itemId: string, status: "active" | "sold" | "resolved"): Promise<boolean> {
  const { error } = await supabase
    .from("items")
    .update({ status })
    .eq("id", itemId)

  if (error) {
    console.error("Failed to update item status:", error.message)
    return false
  }

  return true
}

function applyClientFilters(products: Product[], filters?: ProductFilters): Product[] {
  let result = products

  if (filters?.category && filters.category !== "all") {
    result = result.filter((p) => p.category === filters.category)
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
  let query = supabase
    .from("items")
    .select(ITEM_SELECT_PUBLIC)
    .eq("type", "market")
    .order("created_at", { ascending: false })

  if (filters?.category && filters.category !== "all") {
    query = query.eq("category", filters.category)
  }

  let { data, error } = await query

  if (error) {
    console.error("Failed to fetch marketplace items with profile join, trying fallback:", error.message)
    let fallbackQuery = supabase
      .from("items")
      .select("*")
      .eq("type", "market")
      .order("created_at", { ascending: false })

    if (filters?.category && filters.category !== "all") {
      fallbackQuery = fallbackQuery.eq("category", filters.category)
    }

    const fallback = await fallbackQuery

    if (fallback.error) {
      console.error("Failed to fetch marketplace items:", fallback.error.message)
      return []
    }
    data = fallback.data
  }

  const products = ((data || []) as unknown as ItemRow[]).map(mapItemToProduct)

  // Fetch item_images if they weren't included in the join
  for (const product of products) {
    if (product.photos.length === 0 || (product.photos.length === 1 && product.imageUrl)) {
      const { data: imagesData } = await supabase
        .from("item_images")
        .select("image_url")
        .eq("item_id", product.id)

      if (imagesData && imagesData.length > 0) {
        const fetchedPhotos = imagesData
          .map((img: any) => img.image_url || img.url)
          .filter(Boolean)
        if (fetchedPhotos.length > 0) {
          product.photos = fetchedPhotos
          product.imageUrl = fetchedPhotos[0]
        }
      }
    }
  }

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
  const product = mapItemToProduct(data as unknown as ItemRow)

  // Also query item_images table to ensure all photos (up to 5) are loaded
  const { data: imagesData } = await supabase
    .from("item_images")
    .select("image_url")
    .eq("item_id", id)

  if (imagesData && imagesData.length > 0) {
    const fetchedPhotos = imagesData
      .map((img: any) => img.image_url || img.url)
      .filter(Boolean)
    if (fetchedPhotos.length > 0) {
      product.photos = fetchedPhotos
      product.imageUrl = fetchedPhotos[0]
    }
  }

  return product
}

export async function createProduct(
  input: CreateProductInput,
  userId: string
): Promise<Product> {
  const photos = input.photos && input.photos.length > 0
    ? input.photos
    : (input.imageUrl ? [input.imageUrl] : [])
  const mainImage = photos[0] ?? null

  const { data, error } = await supabase
    .from("items")
    .insert({
      user_id: userId,
      type: "market",
      category: input.category || null,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      price: input.price,
      image_url: mainImage,
      location: input.location.trim(),
      status: "active",
    })
    .select(ITEM_SELECT)
    .single()

  let createdItem = data
  if (error) {
    console.error("Error creating product with profile join, trying fallback:", error.message)
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("items")
      .insert({
        user_id: userId,
        type: "market",
        category: input.category || null,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        price: input.price,
        image_url: mainImage,
        location: input.location.trim(),
        status: "active",
      })
      .select("*")
      .single()

    if (fallbackError || !fallbackData) {
      throw new Error(error.message || fallbackError?.message || "Failed to list item")
    }
    createdItem = fallbackData
  }

  const createdId = (createdItem as any).id

  // Insert photos into item_images table
  if (createdId && photos.length > 0) {
    const imageRows = photos.map((photoUrl) => ({
      item_id: createdId,
      image_url: photoUrl,
    }))
    const { error: imgError } = await supabase.from("item_images").insert(imageRows)
    if (imgError) {
      console.warn("Could not insert into item_images:", imgError.message)
    }
  }

  // Update profile phone & email if provided and changed
  if (userId && (input.sellerPhone || input.sellerEmail)) {
    const updatePayload: Record<string, string> = {}
    if (input.sellerPhone) updatePayload.phone_number = input.sellerPhone.trim()
    if (input.sellerEmail) updatePayload.email = input.sellerEmail.trim()
    await supabase.from("profiles").update(updatePayload).eq("id", userId)
  }

  const product = mapItemToProduct(createdItem as unknown as ItemRow)
  product.photos = photos
  if (photos[0]) product.imageUrl = photos[0]
  if (input.sellerEmail) product.sellerEmail = input.sellerEmail
  if (input.sellerPhone) product.sellerPhone = input.sellerPhone

  return product
}

export async function deleteProduct(id: string, userId: string): Promise<boolean> {
  // Cascading delete for item_images first
  await supabase.from("item_images").delete().eq("item_id", id)

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

export async function adminDeleteProduct(id: string): Promise<boolean> {
  // Cascading delete for item_images first
  await supabase.from("item_images").delete().eq("item_id", id)

  const { error, count } = await supabase
    .from("items")
    .delete({ count: "exact" })
    .eq("id", id)

  if (error) {
    console.error("Failed to delete marketplace item as admin:", error.message)
    return false
  }

  return (count ?? 0) > 0
}
