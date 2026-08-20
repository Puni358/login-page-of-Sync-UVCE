"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ImagePlus, Loader2, X } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import {
  ALLOWED_CATEGORIES,
  MARKETPLACE_CATEGORIES,
  MAX_PHOTO_SIZE_MB,
  MAX_PRODUCT_PHOTOS,
  PRODUCT_CONDITIONS,
} from "@/lib/marketplace/constants"
import { createProduct } from "@/lib/marketplace/product-service"
import type { ProductCategory, ProductCondition } from "@/lib/marketplace/types"
import { getCategoryIcon } from "@/lib/marketplace/utils"
import { cn } from "@/lib/utils"

type FormErrors = Partial<
  Record<"title" | "description" | "category" | "condition" | "photos" | "email" | "phone", string>
>

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function getWordCount(text: string): number {
  const trimmed = text.trim()
  return trimmed ? trimmed.split(/\s+/).length : 0
}

function isValidPhone(phone: string): boolean {
  const digitsOnly = phone.replace(/\D/g, "")
  return digitsOnly.length === 10
}

async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function SellProductForm() {
  const router = useRouter()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<ProductCategory>("general")
  const [condition, setCondition] = useState<ProductCondition | "">("")
  const [email, setEmail] = useState(user?.email ?? "")
  const [phone, setPhone] = useState(user?.phone ?? "")
  const [photos, setPhotos] = useState<string[]>([])
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const clearError = (field: keyof FormErrors) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    clearError("photos")

    if (photos.length + files.length > MAX_PRODUCT_PHOTOS) {
      setErrors((prev) => ({
        ...prev,
        photos: `Maximum ${MAX_PRODUCT_PHOTOS} photos allowed`,
      }))
      return
    }

    const newPhotos: string[] = []
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({ ...prev, photos: "Only image files are allowed (no videos)" }))
        continue
      }
      if (file.size > MAX_PHOTO_SIZE_MB * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          photos: `Each photo must be under ${MAX_PHOTO_SIZE_MB}MB`,
        }))
        continue
      }
      const dataUrl = await readFileAsDataUrl(file)
      newPhotos.push(dataUrl)
    }

    setPhotos((prev) => [...prev, ...newPhotos].slice(0, MAX_PRODUCT_PHOTOS))
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const validate = (): FormErrors => {
    const next: FormErrors = {}
    if (!title.trim()) next.title = "Item title is required"
    if (getWordCount(description) > 250) {
      next.description = "Description cannot exceed 250 words"
    }
    if (!category || !ALLOWED_CATEGORIES.includes(category)) {
      next.category = "Select a valid category"
    }
    if (!condition) next.condition = "Select item condition"
    if (!email.trim() || !isValidEmail(email)) next.email = "Enter a valid email address"
    if (!phone.trim() || !isValidPhone(phone)) next.phone = "Enter a valid 10-digit phone number"
    if (photos.length === 0) next.photos = "Add at least one product photo"
    return next
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setIsSubmitting(true)
    try {
      const product = await createProduct(
        {
          title: title.trim(),
          description: description.trim(),
          price: 0,
          location: "Campus",
          category: category as ProductCategory,
          condition: condition as ProductCondition,
          photos,
          sellerEmail: email.trim(),
          sellerPhone: phone.trim(),
        },
        user.id
      )
      router.push(`/marketplace/${product.id}`)
    } catch {
      setErrors({ title: "Failed to list item. Please try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputClass = (hasError: boolean) =>
    cn(
      "signup-input",
      hasError && "signup-input-error"
    )

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Photos */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-white/80">
          Product Photos <span className="text-white/40">(images only, max {MAX_PRODUCT_PHOTOS})</span>
        </label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {photos.map((photo, index) => (
            <div key={index} className="relative aspect-square overflow-hidden rounded-xl border border-white/5 bg-[#1a1a26]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt={`Product ${index + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-red-500/80"
                aria-label="Remove photo"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {photos.length < MAX_PRODUCT_PHOTOS && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 bg-[#1a1a26] text-white/40 transition-all hover:border-purple-500/40 hover:text-purple-400"
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
          multiple
          className="hidden"
          onChange={handlePhotoSelect}
        />
        {errors.photos && (
          <p className="text-xs text-red-400/90 error-message-enter">{errors.photos}</p>
        )}
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <label htmlFor="title" className="block text-sm font-medium text-white/80">
          Item Title
        </label>
        <input
          id="title"
          type="text"
          placeholder="e.g. Engineering Physics Textbook"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            clearError("title")
          }}
          className={inputClass(!!errors.title)}
        />
        {errors.title && <p className="text-xs text-red-400/90 error-message-enter">{errors.title}</p>}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label htmlFor="description" className="block text-sm font-medium text-white/80">
          Description
        </label>
        <textarea
          id="description"
          rows={4}
          placeholder="Describe the item, course/subject, and any details buyers should know..."
          value={description}
          onChange={(e) => {
            setDescription(e.target.value)
            clearError("description")
          }}
          className={cn(inputClass(!!errors.description), "resize-none")}
        />
        {errors.description && (
          <p className="text-xs text-red-400/90 error-message-enter">{errors.description}</p>
        )}
      </div>

      {/* Category */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white/80">Category</label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {MARKETPLACE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setCategory(cat.id)
                clearError("category")
              }}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-3 text-left transition-all duration-300",
                category === cat.id
                  ? "border-purple-500/50 bg-purple-500/10"
                  : "border-white/5 bg-[#1a1a26] hover:border-purple-500/25"
              )}
            >
              <div className="mt-0.5 text-purple-400">{getCategoryIcon(cat.id)}</div>
              <div>
                <p className="text-sm font-medium text-white">{cat.label}</p>
                <p className="text-xs text-white/40">{cat.description}</p>
              </div>
            </button>
          ))}
        </div>
        {errors.category && (
          <p className="text-xs text-red-400/90 error-message-enter">{errors.category}</p>
        )}
      </div>

      {/* Condition */}
      <div className="space-y-1.5">
        <label htmlFor="condition" className="block text-sm font-medium text-white/80">
          Condition
        </label>
        <select
          id="condition"
          value={condition}
          onChange={(e) => {
            setCondition(e.target.value as ProductCondition)
            clearError("condition")
          }}
          className={cn(inputClass(!!errors.condition), "cursor-pointer")}
        >
          <option value="" disabled className="bg-[#1a1a26]">
            Select condition
          </option>
          {PRODUCT_CONDITIONS.map((c) => (
            <option key={c.value} value={c.value} className="bg-[#1a1a26]">
              {c.label}
            </option>
          ))}
        </select>
        {errors.condition && (
          <p className="text-xs text-red-400/90 error-message-enter">{errors.condition}</p>
        )}
      </div>

      {/* Contact */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-sm font-medium text-white/80">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="your.email@college.edu"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              clearError("email")
            }}
            className={inputClass(!!errors.email)}
          />
          {errors.email && <p className="text-xs text-red-400/90 error-message-enter">{errors.email}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="phone" className="block text-sm font-medium text-white/80">
            Phone Number
          </label>
          <input
            id="phone"
            type="tel"
            placeholder="+91 98765 43210"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value)
              clearError("phone")
            }}
            className={inputClass(!!errors.phone)}
          />
          {errors.phone && <p className="text-xs text-red-400/90 error-message-enter">{errors.phone}</p>}
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
