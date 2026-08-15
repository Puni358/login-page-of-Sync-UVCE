"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { ImagePlus, Loader2, X } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import { createProduct } from "@/lib/marketplace/product-service"
import {
  ALLOWED_CATEGORIES,
  MARKETPLACE_CATEGORIES,
  MAX_PHOTO_SIZE_MB,
  MAX_PRODUCT_PHOTOS,
  PRODUCT_CONDITIONS,
} from "@/lib/marketplace/constants"
import type { ProductCategory, ProductCondition } from "@/lib/marketplace/types"
import { cn } from "@/lib/utils"

type FormErrors = Partial<Record<string, string>>

export function SellForm() {
  const router = useRouter()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<ProductCategory | "">("")
  const [condition, setCondition] = useState<ProductCondition | "">("")
  const [sellerEmail, setSellerEmail] = useState(user?.email ?? "")
  const [sellerPhone, setSellerPhone] = useState(user?.phone ?? "")
  const [photos, setPhotos] = useState<string[]>([])
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validate = (): FormErrors => {
    const next: FormErrors = {}
    if (!title.trim()) next.title = "Title is required"
    if (!description.trim()) next.description = "Description is required"
    if (!category) next.category = "Please select a category"
    if (!condition) next.condition = "Please select a condition"
    if (!sellerEmail.trim()) next.sellerEmail = "Email is required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sellerEmail))
      next.sellerEmail = "Please enter a valid email"
    if (!sellerPhone.trim()) next.sellerPhone = "Phone number is required"
    else if (!/^[+]?[\d\s-]{10,15}$/.test(sellerPhone.replace(/\s/g, "")))
      next.sellerPhone = "Please enter a valid phone number"
    if (photos.length === 0) next.photos = "Add at least one product photo"
    return next
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    const remaining = MAX_PRODUCT_PHOTOS - photos.length
    const toProcess = files.slice(0, remaining)

    toProcess.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({ ...prev, photos: "Only image files are allowed (no video)" }))
        return
      }
      if (file.size > MAX_PHOTO_SIZE_MB * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          photos: `Each photo must be under ${MAX_PHOTO_SIZE_MB}MB`,
        }))
        return
      }

      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setPhotos((prev) => {
            if (prev.length >= MAX_PRODUCT_PHOTOS) return prev
            return [...prev, reader.result as string]
          })
          setErrors((prev) => {
            const next = { ...prev }
            delete next.photos
            return next
          })
        }
      }
      reader.readAsDataURL(file)
    })

    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    if (!user || !category || !condition) return

    setIsSubmitting(true)
    try {
      const product = await createProduct(
        {
          title,
          description,
          category,
          condition,
          photos,
          sellerEmail,
          sellerPhone,
        },
        {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
        }
      )
      router.push(`/marketplace/${product.id}`)
    } catch {
      setErrors({ form: "Failed to list item. Please try again." })
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

      {/* Photos */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-white/80">
          Product Photos <span className="text-white/40">(images only, max {MAX_PRODUCT_PHOTOS})</span>
        </label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {photos.map((photo, index) => (
            <div key={index} className="relative aspect-square overflow-hidden rounded-xl border border-white/5">
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
        {errors.photos && <p className="text-xs text-red-400">{errors.photos}</p>}
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

      {/* Category & Condition */}
      <div className="grid gap-4 sm:grid-cols-2">
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
            className={cn(inputClass(!!errors.category), "appearance-none")}
          >
            <option value="" disabled>
              Select category
            </option>
            {MARKETPLACE_CATEGORIES.filter((c) => ALLOWED_CATEGORIES.includes(c.id)).map((cat) => (
              <option key={cat.id} value={cat.id} className="bg-[#1a1a26]">
                {cat.label}
              </option>
            ))}
          </select>
          {errors.category && <p className="text-xs text-red-400">{errors.category}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="condition" className="text-sm font-medium text-white/80">
            Condition
          </label>
          <select
            id="condition"
            value={condition}
            onChange={(e) => {
              setCondition(e.target.value as ProductCondition)
              setErrors((p) => ({ ...p, condition: undefined }))
            }}
            className={cn(inputClass(!!errors.condition), "appearance-none")}
          >
            <option value="" disabled>
              Select condition
            </option>
            {PRODUCT_CONDITIONS.map((c) => (
              <option key={c.value} value={c.value} className="bg-[#1a1a26]">
                {c.label}
              </option>
            ))}
          </select>
          {errors.condition && <p className="text-xs text-red-400">{errors.condition}</p>}
        </div>
      </div>

      {/* Contact */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="sellerEmail" className="text-sm font-medium text-white/80">
            Your Email
          </label>
          <input
            id="sellerEmail"
            type="email"
            value={sellerEmail}
            onChange={(e) => {
              setSellerEmail(e.target.value)
              setErrors((p) => ({ ...p, sellerEmail: undefined }))
            }}
            placeholder="you@college.edu"
            className={inputClass(!!errors.sellerEmail)}
          />
          {errors.sellerEmail && <p className="text-xs text-red-400">{errors.sellerEmail}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="sellerPhone" className="text-sm font-medium text-white/80">
            Phone Number
          </label>
          <input
            id="sellerPhone"
            type="tel"
            value={sellerPhone}
            onChange={(e) => {
              setSellerPhone(e.target.value)
              setErrors((p) => ({ ...p, sellerPhone: undefined }))
            }}
            placeholder="+91 98765 43210"
            className={inputClass(!!errors.sellerPhone)}
          />
          {errors.sellerPhone && <p className="text-xs text-red-400">{errors.sellerPhone}</p>}
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
