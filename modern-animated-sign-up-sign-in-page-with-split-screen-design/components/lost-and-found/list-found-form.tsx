"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { ImagePlus, Loader2, X } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import { createFoundItem } from "@/lib/lost-and-found/found-item-service"
import { MAX_PHOTO_SIZE_MB, MAX_PRODUCT_PHOTOS } from "@/lib/marketplace/constants"
import { cn } from "@/lib/utils"

export function ListFoundForm() {
  const router = useRouter()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [foundWhere, setFoundWhere] = useState("")
  const [foundWhen, setFoundWhen] = useState("")
  const [listerEmail, setListerEmail] = useState(user?.email ?? "")
  const [listerPhone, setListerPhone] = useState(user?.phone ?? "")
  const [photos, setPhotos] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const inputClass = (hasError: boolean) =>
    cn(
      "w-full rounded-xl border bg-[#1a1a26] px-4 py-3 text-sm text-white placeholder-white/30 transition-all focus:border-purple-500/70 focus:outline-none focus:ring-2 focus:ring-purple-500/25",
      hasError ? "border-red-400/50" : "border-white/5"
    )

  const validate = () => {
    const next: Record<string, string> = {}
    if (!title.trim()) next.title = "Title is required"
    if (!description.trim()) next.description = "Description is required"
    if (!foundWhere.trim()) next.foundWhere = "Location is required"
    if (!foundWhen.trim()) next.foundWhen = "When found is required"
    if (!listerEmail.trim()) next.listerEmail = "Email is required"
    if (!listerPhone.trim()) next.listerPhone = "Phone number is required"
    if (photos.length === 0) next.photos = "Add at least one photo"
    return next
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    files.slice(0, MAX_PRODUCT_PHOTOS - photos.length).forEach((file) => {
      if (!file.type.startsWith("image/")) return
      if (file.size > MAX_PHOTO_SIZE_MB * 1024 * 1024) return
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setPhotos((prev) => (prev.length >= MAX_PRODUCT_PHOTOS ? prev : [...prev, reader.result as string]))
        }
      }
      reader.readAsDataURL(file)
    })
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0 || !user) return

    setIsSubmitting(true)
    try {
      const item = await createFoundItem(
        { title, description, photos, foundWhere, foundWhen, listerEmail, listerPhone },
        { id: user.id, name: `${user.firstName} ${user.lastName}` }
      )
      router.push(`/lost-and-found/${item.id}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="space-y-2">
        <label className="text-sm font-medium text-white/80">Photos (images only)</label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {photos.map((photo, i) => (
            <div key={i} className="relative aspect-square overflow-hidden rounded-xl border border-white/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setPhotos((p) => p.filter((_, idx) => idx !== i))}
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {photos.length < MAX_PRODUCT_PHOTOS && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 bg-[#1a1a26] text-white/40 hover:border-purple-500/40 hover:text-purple-400"
            >
              <ImagePlus className="h-6 w-6" />
              <span className="text-xs">Add photo</span>
            </button>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoSelect} />
        {errors.photos && <p className="text-xs text-red-400">{errors.photos}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="title" className="text-sm font-medium text-white/80">Item title</label>
        <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Black wallet" className={inputClass(!!errors.title)} />
        {errors.title && <p className="text-xs text-red-400">{errors.title}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="description" className="text-sm font-medium text-white/80">Description</label>
        <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Describe the item, distinguishing features..." className={cn(inputClass(!!errors.description), "resize-none")} />
        {errors.description && <p className="text-xs text-red-400">{errors.description}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="foundWhere" className="text-sm font-medium text-white/80">Where found</label>
          <input id="foundWhere" value={foundWhere} onChange={(e) => setFoundWhere(e.target.value)} placeholder="e.g. Main library, 2nd floor" className={inputClass(!!errors.foundWhere)} />
          {errors.foundWhere && <p className="text-xs text-red-400">{errors.foundWhere}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="foundWhen" className="text-sm font-medium text-white/80">When found</label>
          <input id="foundWhen" value={foundWhen} onChange={(e) => setFoundWhen(e.target.value)} placeholder="e.g. 12 Aug 2026, morning" className={inputClass(!!errors.foundWhen)} />
          {errors.foundWhen && <p className="text-xs text-red-400">{errors.foundWhen}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-white/80">Your email</label>
          <input id="email" type="email" value={listerEmail} onChange={(e) => setListerEmail(e.target.value)} className={inputClass(!!errors.listerEmail)} />
          {errors.listerEmail && <p className="text-xs text-red-400">{errors.listerEmail}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="phone" className="text-sm font-medium text-white/80">Phone number</label>
          <input id="phone" type="tel" value={listerPhone} onChange={(e) => setListerPhone(e.target.value)} className={inputClass(!!errors.listerPhone)} />
          {errors.listerPhone && <p className="text-xs text-red-400">{errors.listerPhone}</p>}
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-500 py-3 text-sm font-medium text-white shadow-lg shadow-purple-500/25 hover:bg-purple-400 disabled:opacity-70"
      >
        {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Listing...</> : "List Found Item"}
      </button>
    </form>
  )
}
