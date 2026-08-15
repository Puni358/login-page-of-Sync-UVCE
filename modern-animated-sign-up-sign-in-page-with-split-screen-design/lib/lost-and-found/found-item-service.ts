import type { CreateFoundItemInput, FoundItem } from "./types"

const STORAGE_KEY = "sync_lost_found_items"

function readItems(): FoundItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as FoundItem[]) : []
  } catch {
    return []
  }
}

function writeItems(items: FoundItem[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

function generateId(): string {
  return `found_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export async function getFoundItems(search?: string): Promise<FoundItem[]> {
  // TODO: replace with GET /api/lost-and-found
  let items = readItems().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  if (search?.trim()) {
    const q = search.trim().toLowerCase()
    items = items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.foundWhere.toLowerCase().includes(q)
    )
  }
  return items
}

export async function getFoundItemById(id: string): Promise<FoundItem | null> {
  // TODO: replace with GET /api/lost-and-found/:id
  return readItems().find((item) => item.id === id) ?? null
}

export async function createFoundItem(
  input: CreateFoundItemInput,
  lister: { id: string; name: string }
): Promise<FoundItem> {
  // TODO: replace with POST /api/lost-and-found
  const item: FoundItem = {
    id: generateId(),
    title: input.title.trim(),
    description: input.description.trim(),
    photos: input.photos,
    foundWhere: input.foundWhere.trim(),
    foundWhen: input.foundWhen.trim(),
    listerId: lister.id,
    listerName: lister.name,
    listerEmail: input.listerEmail.trim(),
    listerPhone: input.listerPhone.trim(),
    createdAt: new Date().toISOString(),
  }
  const items = readItems()
  items.unshift(item)
  writeItems(items)
  return item
}
