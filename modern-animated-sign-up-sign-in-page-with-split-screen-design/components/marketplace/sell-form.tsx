"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ImagePlus, Loader2, MapPin, X, Mail, Phone } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import { createProduct } from "@/lib/marketplace/product-service"
import { FORM_CATEGORY_OPTIONS, MAX_PHOTO_SIZE_MB } from "@/lib/marketplace/constants"
import type { ProductCategory } from "@/lib/marketplace/types"
import { cn } from "@/lib/utils"

type FormErrors = Partial<Record<string, string>>

const MAX_PHOTOS = 5

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

function isValidPhone(phone: string): boolean {
  const digitsOnly = phone.replace(/\D/g, "")
  return digitsOnly.length === 10
}

function getWordCount(text: string): number {
  const trimmed = text.trim()
  return trimmed ? trimmed.split(/\s+/).length : 0
}

export function SellForm() {
  const router = useRouter()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState("")
  const [category, setCategory] = useState<ProductCategory>("general")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [location, setLocation] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [photos, setPhotos] = useState<string[]>([])
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (user) {
      if (user.email && !email) setEmail(user.email)
      if (user.phone && !phone) setPhone(user.phone)
    }
  }, [user, email, phone])

  const validate = (): FormErrors => {
    const next: FormErrors = {}
    if (!title.trim()) next.title = "Title is required"
    if (!category) next.category = "Category is required"
    if (getWordCount(description) > 250) {
      next.description = "Description cannot exceed 250 words"
    }
    if (!price.trim()) next.price = "Price is required"
    else if (Number.isNaN(Number(price)) || Number(price) <= 0)
      next.price = "Enter a valid price greater than 0"
    if (!location.trim()) next.location = "Location is required"
    
    if (!email.trim()) {
      next.email = "Email address is required"
    } else if (!isValidEmail(email)) {
      next.email = "Please enter a valid email address (e.g. user@domain.com)"
    }

    if (!phone.trim()) {
      next.phone = "Phone number is required"
    } else if (!isValidPhone(phone)) {
      next.phone = "Please enter a valid 10-digit phone number"
    }

    if (photos.length === 0) {
      next.image = "At least one product photo is required"
    }

    return next
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (selectedFiles.length === 0) return

    const remainingSlots = MAX_PHOTOS - photos.length
    if (remainingSlots <= 0) {
      setErrors((prev) => ({ ...prev, image: `Maximum ${MAX_PHOTOS} photos allowed` }))
      return
    }

    const filesToProcess = selectedFiles.slice(0, remainingSlots)

    filesToProcess.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({ ...prev, image: "Only image files are allowed" }))
        return
      }
      if (file.size > MAX_PHOTO_SIZE_MB * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          image: `Each photo must be under ${MAX_PHOTO_SIZE_MB}MB`,
        }))
        return
      }

      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === "string") {
          const newPhotoUrl = reader.result
          setPhotos((prev) => {
            if (prev.length >= MAX_PHOTOS) return prev
            return [...prev, newPhotoUrl]
          })
          setErrors((prev) => {
            const next = { ...prev }
            delete next.image
            return next
          })
        }
      }
      reader.readAsDataURL(file)
    })

    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const removePhoto = (indexToRemove: number) => {
    setPhotos((prev) => prev.filter((_, idx) => idx !== indexToRemove))
  }

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
          category: category as ProductCategory,
          description,
          price: Number(price),
          location,
          imageUrl: photos[0] ?? null,
          photos,
          sellerEmail: email.trim(),
          sellerPhone: phone.trim(),
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

      {/* Photos (up to 5) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-white/80">Product Photos</label>
          <span className="text-xs text-white/40">{photos.length} of {MAX_PHOTOS} photos</span>
        </div>

        <div className="flex flex-wrap gap-3">
          {photos.map((photoUrl, index) => (
            <div key={index} className="relative aspect-square w-28 overflow-hidden rounded-xl border border-white/10 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoUrl} alt={`Product preview ${index + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-red-500/90"
                aria-label={`Remove photo ${index + 1}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
              {index === 0 && (
                <span className="absolute bottom-1 left-1 rounded bg-purple-600/80 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                  Cover
                </span>
              )}
            </div>
          ))}

          {photos.length < MAX_PHOTOS && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex aspect-square w-28 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/15 bg-[#1a1a26] text-white/40 transition-all hover:border-purple-500/50 hover:text-purple-400"
            >
              <ImagePlus className="h-5 w-5" />
              <span className="text-[11px]">Add photo</span>
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
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

      {/* Category */}
      <div className="space-y-1.5">
        <label htmlFor="category" className="text-sm font-medium text-white/80">
          Category
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value as ProductCategory)
            setErrors((p) => ({ ...p, category: undefined }))
          }}
          className={cn(inputClass(!!errors.category), "cursor-pointer")}
        >
          {FORM_CATEGORY_OPTIONS.map((cat) => (
            <option key={cat.id} value={cat.id} className="bg-[#1a1a26] text-white">
              {cat.label}
            </option>
          ))}
        </select>
        {errors.category && <p className="text-xs text-red-400">{errors.category}</p>}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="description" className="text-sm font-medium text-white/80">
            Description <span className="text-xs font-normal text-white/40">(Optional)</span>
          </label>
          <span
            className={cn(
              "text-xs transition-colors",
              getWordCount(description) > 250 ? "font-semibold text-red-400" : "text-white/40"
            )}
          >
            {getWordCount(description)}/250 words
          </span>
        </div>
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

      {/* Seller Contact Information (Email & Phone, Autofilled & Editable with Validation) */}
      <div className="rounded-2xl border border-white/5 bg-[#12121c] p-4 space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-purple-400/90">
          Seller Contact Info
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-white/80">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setErrors((p) => ({ ...p, email: undefined }))
                }}
                placeholder="name@student.uvce.ac.in"
                className={cn(inputClass(!!errors.email), "pl-10")}
              />
            </div>
            {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="phone" className="text-sm font-medium text-white/80">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value)
                  setErrors((p) => ({ ...p, phone: undefined }))
                }}
                placeholder="9876543210"
                className={cn(inputClass(!!errors.phone), "pl-10")}
              />
            </div>
            {errors.phone && <p className="text-xs text-red-400">{errors.phone}</p>}
          </div>
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
