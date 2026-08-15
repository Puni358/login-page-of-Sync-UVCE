"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ImagePlus, Loader2, X } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import { createLostFoundItem } from "@/lib/lost-and-found/found-item-service"
import { FORM_CATEGORY_OPTIONS, MAX_PHOTO_SIZE_MB, MAX_PRODUCT_PHOTOS } from "@/lib/marketplace/constants"
import type { LostFoundType } from "@/lib/lost-and-found/types"
import type { ProductCategory } from "@/lib/marketplace/types"
import { cn } from "@/lib/utils"

type FormErrors = Partial<Record<string, string>>

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

export function ListFoundForm() {
  const router = useRouter()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [type, setType] = useState<LostFoundType>("lost")
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState<ProductCategory>("general")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [listerEmail, setListerEmail] = useState("")
  const [listerPhone, setListerPhone] = useState("")
  const [photos, setPhotos] = useState<string[]>([])
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (user) {
      if (user.email && !listerEmail) setListerEmail(user.email)
      if (user.phone && !listerPhone) setListerPhone(user.phone)
    }
  }, [user, listerEmail, listerPhone])

  const inputClass = (hasError: boolean) =>
    cn(
      "w-full rounded-xl border bg-[#1a1a26] px-4 py-3 text-sm text-white placeholder-white/30 transition-all focus:border-purple-500/70 focus:outline-none focus:ring-2 focus:ring-purple-500/25",
      hasError ? "border-red-400/50" : "border-white/5"
    )

  const validate = (): FormErrors => {
    const next: FormErrors = {}
    if (!title.trim()) next.title = "Title is required"
    if (getWordCount(description) > 250) {
      next.description = "Description cannot exceed 250 words"
    }
    if (!location.trim()) next.location = "Location is required"

    if (!listerEmail.trim()) {
      next.listerEmail = "Email address is required"
    } else if (!isValidEmail(listerEmail)) {
      next.listerEmail = "Please enter a valid email address"
    }

    if (!listerPhone.trim()) {
      next.listerPhone = "Phone number is required"
    } else if (!isValidPhone(listerPhone)) {
      next.listerPhone = "Please enter a valid 10-digit phone number"
    }

    if (photos.length === 0) {
      next.photos = "At least one photo is required"
    }

    return next
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (selectedFiles.length === 0) return

    const remainingSlots = MAX_PRODUCT_PHOTOS - photos.length
    if (remainingSlots <= 0) {
      setErrors((prev) => ({ ...prev, photos: `Maximum ${MAX_PRODUCT_PHOTOS} photos allowed` }))
      return
    }

    const filesToProcess = selectedFiles.slice(0, remainingSlots)

    filesToProcess.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({ ...prev, photos: "Only image files are allowed" }))
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
          const newPhotoUrl = reader.result
          setPhotos((prev) => {
            if (prev.length >= MAX_PRODUCT_PHOTOS) return prev
            return [...prev, newPhotoUrl]
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0 || !user) return

    setIsSubmitting(true)
    try {
      const item = await createLostFoundItem(
        {
          type,
          title,
          category,
          description,
          location,
          photos,
          listerEmail: listerEmail.trim(),
          listerPhone: listerPhone.trim(),
        },
        user.id
      )
      router.push(`/lost-and-found/${item.id}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to list item. Please try again."
      setErrors({ form: msg })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {errors.form && (
        <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {errors.form}
        </p>
      )}

      {/* Report Type Toggle */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-white/80">Listing Type</label>
        <div className="flex rounded-xl bg-[#1a1a26] p-1.5 border border-white/5">
          <button
            type="button"
            onClick={() => setType("lost")}
            className={cn(
              "flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all",
              type === "lost"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                : "text-white/50 hover:text-white"
            )}
          >
            Report Lost Item
          </button>
          <button
            type="button"
            onClick={() => setType("found")}
            className={cn(
              "flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all",
              type === "found"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm"
                : "text-white/50 hover:text-white"
            )}
          >
            Report Found Item
          </button>
        </div>
      </div>

      {/* Photos (up to 5) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-white/80">Photos</label>
          <span className="text-xs text-white/40">{photos.length} of {MAX_PRODUCT_PHOTOS} photos</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {photos.map((photo, i) => (
            <div key={i} className="relative aspect-square w-24 overflow-hidden rounded-xl border border-white/10 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setPhotos((p) => p.filter((_, idx) => idx !== i))}
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white hover:bg-red-500/90 transition-colors"
                aria-label={`Remove photo ${i + 1}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
              {i === 0 && (
                <span className="absolute bottom-1 left-1 rounded bg-purple-600/80 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                  Cover
                </span>
              )}
            </div>
          ))}
          {photos.length < MAX_PRODUCT_PHOTOS && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex aspect-square w-24 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/15 bg-[#1a1a26] text-white/40 hover:border-purple-500/40 hover:text-purple-400 transition-colors"
            >
              <ImagePlus className="h-5 w-5" />
              <span className="text-[11px]">Add photo</span>
            </button>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoSelect} />
        {errors.photos && <p className="text-xs text-red-400">{errors.photos}</p>}
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <label htmlFor="title" className="text-sm font-medium text-white/80">Item Title</label>
        <input
          id="title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            setErrors((p) => ({ ...p, title: undefined }))
          }}
          placeholder={type === "lost" ? "e.g. Black leather wallet with student ID" : "e.g. Casio Scientific Calculator FX-991EX"}
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
          onChange={(e) => setCategory(e.target.value as ProductCategory)}
          className={cn(inputClass(false), "cursor-pointer")}
        >
          {FORM_CATEGORY_OPTIONS.map((cat) => (
            <option key={cat.id} value={cat.id} className="bg-[#1a1a26] text-white">
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {/* Description (Optional) */}
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
          placeholder="Describe the item, distinguishing marks, color, brand..."
          className={cn(inputClass(!!errors.description), "resize-none")}
        />
        {errors.description && <p className="text-xs text-red-400">{errors.description}</p>}
      </div>

      {/* Location */}
      <div className="space-y-1.5">
        <label htmlFor="location" className="text-sm font-medium text-white/80">
          {type === "lost" ? "Where was it lost?" : "Where was it found?"}
        </label>
        <input
          id="location"
          value={location}
          onChange={(e) => {
            setLocation(e.target.value)
            setErrors((p) => ({ ...p, location: undefined }))
          }}
          placeholder="e.g. Main Library 2nd Floor, Seminar Hall B, etc."
          className={inputClass(!!errors.location)}
        />
        {errors.location && <p className="text-xs text-red-400">{errors.location}</p>}
      </div>

      {/* Contact Info */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="listerEmail" className="text-sm font-medium text-white/80">Your Email</label>
          <input
            id="listerEmail"
            type="email"
            value={listerEmail}
            onChange={(e) => {
              setListerEmail(e.target.value)
              setErrors((p) => ({ ...p, listerEmail: undefined }))
            }}
            className={inputClass(!!errors.listerEmail)}
          />
          {errors.listerEmail && <p className="text-xs text-red-400">{errors.listerEmail}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="listerPhone" className="text-sm font-medium text-white/80">Phone Number</label>
          <input
            id="listerPhone"
            type="tel"
            value={listerPhone}
            onChange={(e) => {
              setListerPhone(e.target.value)
              setErrors((p) => ({ ...p, listerPhone: undefined }))
            }}
            placeholder="10-digit phone number"
            className={inputClass(!!errors.listerPhone)}
          />
          {errors.listerPhone && <p className="text-xs text-red-400">{errors.listerPhone}</p>}
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white shadow-lg transition-all disabled:opacity-70",
          type === "lost"
            ? "bg-amber-600 shadow-amber-600/25 hover:bg-amber-500"
            : "bg-purple-600 shadow-purple-600/25 hover:bg-purple-500"
        )}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
          </>
        ) : type === "lost" ? (
          "Submit Lost Item Report"
        ) : (
          "Submit Found Item Report"
        )}
      </button>
    </form>
  )
}
