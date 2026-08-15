"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { X, ZoomIn } from "lucide-react"

type LightboxContextType = {
  openLightbox: (src: string, alt?: string) => void
  closeLightbox: () => void
}

const LightboxContext = createContext<LightboxContextType>({
  openLightbox: () => {},
  closeLightbox: () => {},
})

export function LightboxProvider({ children }: { children: React.ReactNode }) {
  const [activeImage, setActiveImage] = useState<{ src: string; alt?: string } | null>(null)

  const openLightbox = useCallback((src: string, alt?: string) => {
    setActiveImage({ src, alt })
  }, [])

  const closeLightbox = useCallback(() => {
    setActiveImage(null)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeLightbox()
      }
    }

    if (activeImage) {
      document.body.style.overflow = "hidden"
      window.addEventListener("keydown", handleKeyDown)
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [activeImage, closeLightbox])

  return (
    <LightboxContext.Provider value={{ openLightbox, closeLightbox }}>
      {children}
      {activeImage && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md transition-all animate-in fade-in duration-200"
          onClick={closeLightbox}
        >
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute right-5 top-5 z-[100000] flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md hover:bg-white/20 hover:scale-105 transition-all shadow-xl focus:outline-none"
            aria-label="Close image viewer"
          >
            <X className="h-6 w-6" />
          </button>

          <div
            className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-2xl border border-white/10 shadow-2xl transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeImage.src}
              alt={activeImage.alt || "Enlarged view"}
              className="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl select-none"
            />
            {activeImage.alt && (
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-center text-sm font-medium text-white/90">
                {activeImage.alt}
              </div>
            )}
          </div>
        </div>
      )}
    </LightboxContext.Provider>
  )
}

export function useLightbox() {
  return useContext(LightboxContext)
}

export function ZoomableImage({
  src,
  alt = "",
  className = "",
  containerClassName = "",
  children,
  ...props
}: {
  src: string
  alt?: string
  className?: string
  containerClassName?: string
  children?: React.ReactNode
} & Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "alt">) {
  const { openLightbox } = useLightbox()

  if (!src) return null

  return (
    <div
      onClick={(e) => {
        e.stopPropagation()
        openLightbox(src, alt)
      }}
      className={`group/zoom relative cursor-pointer overflow-hidden ${containerClassName}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className={`transition-transform duration-300 group-hover/zoom:scale-105 ${className}`} {...props} />
      <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover/zoom:bg-black/30 transition-all pointer-events-none opacity-0 group-hover/zoom:opacity-100">
        <div className="rounded-full bg-black/60 p-2 text-white backdrop-blur-sm shadow-md transform scale-90 group-hover/zoom:scale-100 transition-all">
          <ZoomIn className="h-4 w-4" />
        </div>
      </div>
      {children}
    </div>
  )
}
