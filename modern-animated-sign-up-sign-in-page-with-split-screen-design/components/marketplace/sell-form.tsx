"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { ImagePlus, Loader2, MapPin, X } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import { createProduct } from "@/lib/marketplace/product-service"
import { MAX_PHOTO_SIZE_MB } from "@/lib/marketplace/constants"
import { cn } from "@/lib/utils"

type FormErrors = Partial<Record<string, string>>

export function SellForm() {
  const router = useRouter()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [location, setLocation] = useState("")
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validate = (): FormErrors => {
    const next: FormErrors = {}
    if (!title.trim()) next.title = "Title is required"
    if (!description.trim()) next.description = "Description is required"
    if (!price.trim()) next.price = "Price is required"
    else if (Number.isNaN(Number(price)) || Number(price) <= 0)
      next.price = "Enter a valid price greater than 0"
    if (!location.trim()) next.location = "Location is required"
    if (!imageUrl) next.image = "Add a product photo"
    return next
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, image: "Only image files are allowed" }))
      return
    }
    if (file.size > MAX_PHOTO_SIZE_MB * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        image: `Photo must be under ${MAX_PHOTO_SIZE_MB}MB`,
      }))
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImageUrl(reader.result)
        setErrors((prev) => {
          const next = { ...prev }
          delete next.image
          return next
        })
      }
    }
    reader.readAsDataURL(file)

    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const removePhoto = () => setImageUrl(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    if (!user) return

    setIsSubmitting(true)
    try {
      const product = await createProduct(
        {
          title,
          description,
          price: Number(price),
          location,
          imageUrl,
        },
        user.id
      )
      router.push(`/marketplace/${product.id}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to list item. Please try again."
      setErrors({ form: msg })
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputClass = (hasError: boolean) =>
    cn(
      "w-full rounded-xl border bg-[#1a1a26] px-4 py-3 text-sm text-white placeholder-white/30 transition-all duration-300 focus:outline-none focus:border-purple-500/70 focus:ring-2 focus:ring-purple-500/25",
      hasError ? "border-red-400/50" : "border-white/5"
    )

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {errors.form && (
        <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {errors.form}
        </p>
      )}

      {/* Photo */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-white/80">Product Photo</label>
        <div className="flex gap-3">
          {imageUrl ? (
            <div className="relative aspect-square w-40 overflow-hidden rounded-xl border border-white/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="Product preview" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={removePhoto}
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-red-500/80"
                aria-label="Remove photo"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex aspect-square w-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 bg-[#1a1a26] text-white/40 transition-all hover:border-purple-500/40 hover:text-purple-400"
            >
              <ImagePlus className="h-6 w-6" />
              <span className="text-xs">Add photo</span>
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoSelect}
        />
        {errors.image && <p className="text-xs text-red-400">{errors.image}</p>}
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <label htmlFor="title" className="text-sm font-medium text-white/80">
          Title
        </label>
        <input
          id="title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            setErrors((p) => ({ ...p, title: undefined }))
          }}
          placeholder="e.g. Engineering Physics Textbook — 3rd Edition"
          className={inputClass(!!errors.title)}
        />
        {errors.title && <p className="text-xs text-red-400">{errors.title}</p>}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label htmlFor="description" className="text-sm font-medium text-white/80">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value)
            setErrors((p) => ({ ...p, description: undefined }))
          }}
          rows={4}
          placeholder="Describe the item, course/semester it was used for, and any notes for the buyer..."
          className={cn(inputClass(!!errors.description), "resize-none")}
        />
        {errors.description && <p className="text-xs text-red-400">{errors.description}</p>}
      </div>

      {/* Price & Location */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="price" className="text-sm font-medium text-white/80">
            Price (₹)
          </label>
          <input
            id="price"
            type="number"
            min="1"
            step="1"
            value={price}
            onChange={(e) => {
              setPrice(e.target.value)
              setErrors((p) => ({ ...p, price: undefined }))
            }}
            placeholder="500"
            className={inputClass(!!errors.price)}
          />
          {errors.price && <p className="text-xs text-red-400">{errors.price}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="location" className="text-sm font-medium text-white/80">
            Pickup Location
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              id="location"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value)
                setErrors((p) => ({ ...p, location: undefined }))
              }}
              placeholder="e.g. Main campus library"
              className={cn(inputClass(!!errors.location), "pl-10")}
            />
          </div>
          {errors.location && <p className="text-xs text-red-400">{errors.location}</p>}
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-500 py-3 text-sm font-medium text-white shadow-lg shadow-purple-500/25 transition-all hover:bg-purple-400 hover:shadow-purple-500/40 disabled:cursor-wait disabled:opacity-70"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Listing item...
          </>
        ) : (
          "List Item for Sale"
        )}
      </button>
    </form>
  )
}
