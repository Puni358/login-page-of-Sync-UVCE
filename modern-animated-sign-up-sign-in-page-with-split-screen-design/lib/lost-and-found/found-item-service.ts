import { supabase } from "@/lib/supabaseClient"
import type { ItemRow, ProductCategory } from "@/lib/marketplace/types"
import type {
  CreateLostFoundItemInput,
  LostFoundFilters,
  LostFoundItem,
  LostFoundType,
} from "./types"

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

function mapItemToLostFound(row: ItemRow): LostFoundItem {
  const rawProfile = row.profiles
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
    type: (row.type === "lost" ? "lost" : "found") as LostFoundType,
    title: row.title,
    description: row.description ?? "",
    location: row.location ?? "",
    category: (row.category as ProductCategory) || undefined,
    imageUrl: photos[0] ?? mainImageUrl ?? null,
    photos,
    listerId: row.user_id,
    listerName: profile?.full_name?.trim() || "User",
    listerEmail: profile?.email ?? "",
    listerPhone: profile?.phone_number ?? "",
    createdAt: row.created_at,
  }
}

function applyClientFilters(items: LostFoundItem[], filters?: LostFoundFilters): LostFoundItem[] {
  let result = items

  if (filters?.type && filters.type !== "all") {
    result = result.filter((item) => item.type === filters.type)
  }

  if (filters?.category && filters.category !== "all") {
    result = result.filter((item) => item.category === filters.category)
  }

  if (filters?.search?.trim()) {
    const q = filters.search.trim().toLowerCase()
    result = result.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        item.location.toLowerCase().includes(q)
    )
  }

  return result
}

export async function getLostFoundItems(filters?: LostFoundFilters): Promise<LostFoundItem[]> {
  let query = supabase
    .from("items")
    .select(ITEM_SELECT)
    .in("type", ["lost", "found"])
    .order("created_at", { ascending: false })

  if (filters?.type && filters.type !== "all") {
    query = query.eq("type", filters.type)
  }

  if (filters?.category && filters.category !== "all") {
    query = query.eq("category", filters.category)
  }

  let { data, error } = await query

  if (error) {
    console.error("Failed to fetch lost & found items with profile join, trying fallback:", error.message)
    let fallbackQuery = supabase
      .from("items")
      .select("*")
      .in("type", ["lost", "found"])
      .order("created_at", { ascending: false })

    if (filters?.type && filters.type !== "all") {
      fallbackQuery = fallbackQuery.eq("type", filters.type)
    }
    if (filters?.category && filters.category !== "all") {
      fallbackQuery = fallbackQuery.eq("category", filters.category)
    }

    const fallback = await fallbackQuery
    if (fallback.error) {
      console.error("Failed to fetch lost & found items:", fallback.error.message)
      return []
    }
    data = fallback.data
  }

  const items = ((data || []) as unknown as ItemRow[]).map(mapItemToLostFound)

  // Fetch item_images if they weren't included in the join
  for (const item of items) {
    if (item.photos.length === 0 || (item.photos.length === 1 && item.imageUrl)) {
      const { data: imagesData } = await supabase
        .from("item_images")
        .select("image_url")
        .eq("item_id", item.id)

      if (imagesData && imagesData.length > 0) {
        const fetchedPhotos = imagesData
          .map((img: any) => img.image_url || img.url)
          .filter(Boolean)
        if (fetchedPhotos.length > 0) {
          item.photos = fetchedPhotos
          item.imageUrl = fetchedPhotos[0]
        }
      }
    }
  }

  return applyClientFilters(items, filters)
}

export async function getLostFoundItemById(id: string): Promise<LostFoundItem | null> {
  let { data, error } = await supabase
    .from("items")
    .select(ITEM_SELECT)
    .eq("id", id)
    .in("type", ["lost", "found"])
    .maybeSingle()

  if (error) {
    console.error("Failed to fetch lost/found item with profile join, trying fallback:", error.message)
    const fallback = await supabase
      .from("items")
      .select("*")
      .eq("id", id)
      .in("type", ["lost", "found"])
      .maybeSingle()

    if (fallback.error || !fallback.data) {
      console.error("Failed to fetch lost/found item:", fallback.error?.message)
      return null
    }
    data = fallback.data
  }

  if (!data) return null
  const item = mapItemToLostFound(data as unknown as ItemRow)

  // Fetch item_images table to ensure all photos (up to 5) are loaded
  const { data: imagesData } = await supabase
    .from("item_images")
    .select("image_url")
    .eq("item_id", id)

  if (imagesData && imagesData.length > 0) {
    const fetchedPhotos = imagesData
      .map((img: any) => img.image_url || img.url)
      .filter(Boolean)
    if (fetchedPhotos.length > 0) {
      item.photos = fetchedPhotos
      item.imageUrl = fetchedPhotos[0]
    }
  }

  return item
}

export async function createLostFoundItem(
  input: CreateLostFoundItemInput,
  userId: string
): Promise<LostFoundItem> {
  const photos =
    input.photos && input.photos.length > 0
      ? input.photos
      : input.imageUrl
      ? [input.imageUrl]
      : []
  const mainImage = photos[0] ?? null

  const { data, error } = await supabase
    .from("items")
    .insert({
      user_id: userId,
      type: input.type,
      category: input.category || "general",
      title: input.title.trim(),
      description: input.description?.trim() || null,
      price: 0,
      image_url: mainImage,
      location: input.location.trim(),
      status: "active",
    })
    .select(ITEM_SELECT)
    .single()

  let createdItem = data
  if (error) {
    console.error("Error creating lost/found item with profile join, trying fallback:", error.message)
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("items")
      .insert({
        user_id: userId,
        type: input.type,
        category: input.category || "general",
        title: input.title.trim(),
        description: input.description?.trim() || null,
        price: 0,
        image_url: mainImage,
        location: input.location.trim(),
        status: "active",
      })
      .select("*")
      .single()

    if (fallbackError || !fallbackData) {
      throw new Error(error.message || fallbackError?.message || "Failed to create lost/found listing")
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
  if (userId && (input.listerPhone || input.listerEmail)) {
    const updatePayload: Record<string, string> = {}
    if (input.listerPhone) updatePayload.phone_number = input.listerPhone.trim()
    if (input.listerEmail) updatePayload.email = input.listerEmail.trim()
    await supabase.from("profiles").update(updatePayload).eq("id", userId)
  }

  const item = mapItemToLostFound(createdItem as unknown as ItemRow)
  item.photos = photos
  if (photos[0]) item.imageUrl = photos[0]
  if (input.listerEmail) item.listerEmail = input.listerEmail
  if (input.listerPhone) item.listerPhone = input.listerPhone

  return item
}

export async function deleteLostFoundItem(id: string): Promise<boolean> {
  // 1. Delete associated images from item_images table
  const { error: imgError } = await supabase
    .from("item_images")
    .delete()
    .eq("item_id", id)

  if (imgError) {
    console.warn("Error deleting item_images for lost/found item:", imgError.message)
  }

  // 2. Delete item from items table
  const { error } = await supabase
    .from("items")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Failed to delete lost/found item:", error.message)
    throw new Error(error.message || "Failed to delete item")
  }

  return true
}

// Backward compatibility helper wrappers
export async function getFoundItems(search?: string): Promise<LostFoundItem[]> {
  return getLostFoundItems({ search })
}

export async function getFoundItemById(id: string): Promise<LostFoundItem | null> {
  return getLostFoundItemById(id)
}

export async function createFoundItem(
  input: any,
  lister: { id: string; name: string }
): Promise<LostFoundItem> {
  return createLostFoundItem(
    {
      type: input.type || "found",
      title: input.title,
      description: input.description,
      photos: input.photos,
      location: input.location || input.foundWhere || "",
      category: input.category || "general",
      listerEmail: input.listerEmail,
      listerPhone: input.listerPhone,
    },
    lister.id
  )
}
