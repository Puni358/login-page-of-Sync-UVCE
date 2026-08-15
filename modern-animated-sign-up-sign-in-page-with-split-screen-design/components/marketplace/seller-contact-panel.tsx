"use client"

import Link from "next/link"
import { Lock, Mail, Phone, User } from "lucide-react"
import type { Product } from "@/lib/marketplace/types"

interface SellerContactPanelProps {
  product: Product
  isAuthenticated: boolean
  loginHref: string
}

export function SellerContactPanel({
  product,
  isAuthenticated,
  loginHref,
}: SellerContactPanelProps) {
  if (!isAuthenticated) {
    return (
      <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400">
            <Lock className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">Login to contact seller</h3>
            <p className="mt-1 text-sm text-white/50">
              Sign in to view the seller&apos;s name, email, and phone number for this item.
            </p>
            <Link
              href={loginHref}
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-purple-500 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-purple-500/25 transition-all hover:bg-purple-400 hover:shadow-purple-500/40"
            >
              Login to Buy
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-[#12121a] p-6">
      <h3 className="mb-4 text-lg font-semibold text-white">Seller Contact</h3>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/15 text-purple-400">
            <User className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs text-white/40">Name</p>
            <p className="text-sm font-medium text-white">{product.sellerName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/15 text-purple-400">
            <Mail className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs text-white/40">Email</p>
            <a
              href={`mailto:${product.sellerEmail}`}
              className="text-sm font-medium text-purple-300 hover:text-purple-200 transition-colors"
            >
              {product.sellerEmail}
            </a>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/15 text-purple-400">
            <Phone className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs text-white/40">Phone</p>
            <a
              href={`tel:${product.sellerPhone}`}
              className="text-sm font-medium text-purple-300 hover:text-purple-200 transition-colors"
            >
              {product.sellerPhone}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
