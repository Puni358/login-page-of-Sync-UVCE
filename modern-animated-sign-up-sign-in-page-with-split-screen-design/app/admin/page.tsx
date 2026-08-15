"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Loader2,
  MapPin,
  MessageSquare,
  Shield,
  Trash2,
  X,
  ShoppingBag,
  Users,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { fetchPendingProfiles, updateProfileStatus } from "@/lib/auth/admin-service"
import { getProducts, adminDeleteProduct, updateItemStatus } from "@/lib/marketplace/product-service"
import { getLostFoundItems, deleteLostFoundItem } from "@/lib/lost-and-found/found-item-service"
import {
  getQuestions,
  deleteQuestion,
  deleteAnswer,
  getCategoryLabel,
} from "@/lib/suggestions/suggestion-service"
import type { Profile } from "@/lib/auth/types"
import type { Product } from "@/lib/marketplace/types"
import type { LostFoundItem } from "@/lib/lost-and-found/types"
import type { SuggestionQuestion } from "@/lib/suggestions/types"
import { formatDate, formatPrice } from "@/lib/marketplace/utils"
import { ZoomableImage } from "@/components/ui/lightbox-context"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

function displayValue(value: string | null | undefined, fallback = "—") {
  return value?.trim() ? value : fallback
}

export default function AdminPage() {
  const router = useRouter()
  const { isLoading: authLoading, isAuthenticated, isAdmin } = useAuth()

  const [activeTab, setActiveTab] = useState<"users" | "marketplace" | "lost-found" | "suggestions">("users")
  const [pendingUsers, setPendingUsers] = useState<Profile[]>([])
  const [listings, setListings] = useState<Product[]>([])
  const [lostFoundListings, setLostFoundListings] = useState<LostFoundItem[]>([])
  const [suggestionsListings, setSuggestionsListings] = useState<SuggestionQuestion[]>([])
  const [expandedQuestionIds, setExpandedQuestionIds] = useState<Set<string>>(new Set())

  const [isLoadingData, setIsLoadingData] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actingOnId, setActingOnId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoadingData(true)
    setLoadError(null)
    try {
      const [users, products, lostFound, suggestions] = await Promise.all([
        fetchPendingProfiles(),
        getProducts(),
        getLostFoundItems(),
        getQuestions(),
      ])
      setPendingUsers(users)
      setListings(products)
      setLostFoundListings(lostFound)
      setSuggestionsListings(suggestions)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load admin data")
    } finally {
      setIsLoadingData(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading) return

    if (!isAuthenticated) {
      router.replace("/?mode=login&redirect=%2Fadmin")
      return
    }

    if (!isAdmin) {
      router.replace("/marketplace")
    }
  }, [authLoading, isAuthenticated, isAdmin, router])

  useEffect(() => {
    if (authLoading || !isAdmin) return
    loadData()
  }, [authLoading, isAdmin, loadData])

  const toggleExpandQuestion = (id: string) => {
    setExpandedQuestionIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleStatusUpdate = async (
    profileId: string,
    status: "approved" | "rejected"
  ) => {
    setActingOnId(profileId)
    setActionError(null)
    try {
      await updateProfileStatus(profileId, status)
      setPendingUsers((current) => current.filter((user) => user.id !== profileId))
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update user status")
    } finally {
      setActingOnId(null)
    }
  }

  const handleDeleteListing = async (productId: string, productTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${productTitle}" for moderation?`)) {
      return
    }

    setActingOnId(productId)
    setActionError(null)
    try {
      const success = await adminDeleteProduct(productId)
      if (success) {
        setListings((current) => current.filter((p) => p.id !== productId))
      } else {
        setActionError("Failed to delete listing.")
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Error deleting listing")
    } finally {
      setActingOnId(null)
    }
  }

  const handleToggleMarketplaceStatus = async (item: Product) => {
    const newStatus = item.status === "sold" ? "active" : "sold"
    setActingOnId(item.id)
    setActionError(null)
    try {
      const success = await updateItemStatus(item.id, newStatus)
      if (success) {
        setListings((current) =>
          current.map((p) => (p.id === item.id ? { ...p, status: newStatus } : p))
        )
      } else {
        setActionError("Failed to update marketplace listing status.")
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Error updating item status")
    } finally {
      setActingOnId(null)
    }
  }

  const handleDeleteLostFoundListing = async (itemId: string, itemTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete lost & found listing "${itemTitle}" for moderation?`)) {
      return
    }

    setActingOnId(itemId)
    setActionError(null)
    try {
      const success = await deleteLostFoundItem(itemId)
      if (success) {
        setLostFoundListings((current) => current.filter((p) => p.id !== itemId))
      } else {
        setActionError("Failed to delete lost & found listing.")
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Error deleting lost & found listing")
    } finally {
      setActingOnId(null)
    }
  }

  const handleToggleLostFoundStatus = async (item: LostFoundItem) => {
    const newStatus = item.status === "resolved" ? "active" : "resolved"
    setActingOnId(item.id)
    setActionError(null)
    try {
      const success = await updateItemStatus(item.id, newStatus)
      if (success) {
        setLostFoundListings((current) =>
          current.map((p) => (p.id === item.id ? { ...p, status: newStatus } : p))
        )
      } else {
        setActionError("Failed to update lost & found listing status.")
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Error updating item status")
    } finally {
      setActingOnId(null)
    }
  }

  const handleDeleteAdminQuestion = async (qId: string, qText: string) => {
    if (!window.confirm(`Are you sure you want to delete this question for moderation?\n\n"${qText.slice(0, 60)}..."`)) {
      return
    }
    setActingOnId(qId)
    setActionError(null)
    try {
      await deleteQuestion(qId)
      setSuggestionsListings((current) => current.filter((q) => q.id !== qId))
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to delete question")
    } finally {
      setActingOnId(null)
    }
  }

  const handleDeleteAdminAnswer = async (qId: string, ansId: string) => {
    if (!window.confirm("Are you sure you want to delete this answer for moderation?")) {
      return
    }
    setActingOnId(ansId)
    setActionError(null)
    try {
      await deleteAnswer(ansId)
      setSuggestionsListings((current) =>
        current.map((q) =>
          q.id === qId
            ? { ...q, answers: q.answers.filter((a) => a.id !== ansId) }
            : q
        )
      )
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to delete answer")
    } finally {
      setActingOnId(null)
    }
  }

  if (authLoading || !isAuthenticated || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1a1a24]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1a1a24] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/15 text-purple-400">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-sm text-white/50">Review registrations and moderate campus listings &amp; Q&amp;A</p>
            </div>
          </div>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 self-start text-sm text-purple-400 transition-colors hover:text-purple-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sync - UVCE
          </Link>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 flex flex-wrap gap-3 border-b border-white/5 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "users"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                : "text-white/50 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Users className="h-4 w-4" />
            Pending Users ({pendingUsers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("marketplace")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "marketplace"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                : "text-white/50 hover:bg-white/5 hover:text-white"
            }`}
          >
            <ShoppingBag className="h-4 w-4" />
            Marketplace ({listings.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("lost-found")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "lost-found"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                : "text-white/50 hover:bg-white/5 hover:text-white"
            }`}
          >
            <MapPin className="h-4 w-4" />
            Lost &amp; Found ({lostFoundListings.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("suggestions")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "suggestions"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                : "text-white/50 hover:bg-white/5 hover:text-white"
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            Suggestions ({suggestionsListings.length})
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#12121a] shadow-2xl">
          {loadError && (
            <div className="border-b border-red-500/20 bg-red-500/10 px-6 py-3 text-sm text-red-400">
              {loadError}
            </div>
          )}

          {actionError && (
            <div className="border-b border-red-500/20 bg-red-500/10 px-6 py-3 text-sm text-red-400">
              {actionError}
            </div>
          )}

          {isLoadingData ? (
            <div className="flex items-center justify-center px-6 py-12">
              <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
            </div>
          ) : (
            <>
              {/* Users Tab */}
              {activeTab === "users" && (
                <div>
                  <div className="border-b border-white/5 px-6 py-4">
                    <h2 className="text-lg font-semibold text-white">Pending Registrations</h2>
                    <p className="mt-1 text-xs text-white/40">
                      {pendingUsers.length} registration{pendingUsers.length !== 1 ? "s" : ""} awaiting review
                    </p>
                  </div>

                  {pendingUsers.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                      <p className="text-sm text-white/50">No pending registrations at the moment.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/5 hover:bg-transparent">
                          <TableHead className="text-white/50">Name</TableHead>
                          <TableHead className="text-white/50">Email</TableHead>
                          <TableHead className="text-white/50">USN</TableHead>
                          <TableHead className="text-white/50">Phone</TableHead>
                          <TableHead className="text-right text-white/50">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingUsers.map((userItem) => {
                          const isActing = actingOnId === userItem.id

                          return (
                            <TableRow key={userItem.id} className="border-white/5 hover:bg-white/[0.02]">
                              <TableCell className="font-medium text-white/90">
                                {displayValue(userItem.full_name)}
                              </TableCell>
                              <TableCell className="text-white/70">{displayValue(userItem.email)}</TableCell>
                              <TableCell className="text-white/70">{displayValue(userItem.usn)}</TableCell>
                              <TableCell className="text-white/70">
                                {displayValue(userItem.phone_number)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    disabled={isActing}
                                    onClick={() => handleStatusUpdate(userItem.id, "approved")}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {isActing ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Check className="h-3.5 w-3.5" />
                                    )}
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isActing}
                                    onClick={() => handleStatusUpdate(userItem.id, "rejected")}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {isActing ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <X className="h-3.5 w-3.5" />
                                    )}
                                    Reject
                                  </button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  )}
                </div>
              )}

              {/* Marketplace Tab */}
              {activeTab === "marketplace" && (
                <div>
                  <div className="border-b border-white/5 px-6 py-4">
                    <h2 className="text-lg font-semibold text-white">Marketplace Listings Moderation</h2>
                    <p className="mt-1 text-xs text-white/40">
                      Manage, mark status, or delete items across the campus marketplace
                    </p>
                  </div>

                  {listings.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                      <p className="text-sm text-white/50">No marketplace listings.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/5 hover:bg-transparent">
                          <TableHead className="text-white/50">Item</TableHead>
                          <TableHead className="text-white/50">Status</TableHead>
                          <TableHead className="text-white/50">Seller</TableHead>
                          <TableHead className="text-white/50">Price</TableHead>
                          <TableHead className="text-white/50">Location</TableHead>
                          <TableHead className="text-white/50">Listed Date</TableHead>
                          <TableHead className="text-right text-white/50">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {listings.map((item) => {
                          const isActing = actingOnId === item.id
                          const isSold = item.status === "sold"

                          return (
                            <TableRow key={item.id} className="border-white/5 hover:bg-white/[0.02]">
                              <TableCell className="font-medium text-white/90">
                                <div className="flex items-center gap-3">
                                  {item.imageUrl ? (
                                    <ZoomableImage
                                      src={item.imageUrl}
                                      alt={item.title}
                                      className="h-full w-full object-cover"
                                      containerClassName="h-10 w-10 shrink-0 rounded-lg border border-white/10"
                                    />
                                  ) : (
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs text-white/40">
                                      No Img
                                    </div>
                                  )}
                                  <div>
                                    <Link
                                      href={`/marketplace/${item.id}`}
                                      className="font-medium text-white hover:text-purple-300 transition-colors"
                                    >
                                      {item.title}
                                    </Link>
                                    <p className="text-xs text-white/40 line-clamp-1">{item.description}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {isSold ? (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-300 border border-emerald-500/30">
                                    <CheckCircle2 className="h-3 w-3" /> ✓ Sold
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/20 px-2 py-0.5 text-[11px] font-bold text-purple-300 border border-purple-500/30">
                                    Active
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-white/70">
                                <div>
                                  <p className="text-xs font-medium text-white/80">{item.sellerName}</p>
                                  <p className="text-[11px] text-white/40">{item.sellerEmail || "No email"}</p>
                                </div>
                              </TableCell>
                              <TableCell className="text-purple-300 font-semibold">{formatPrice(item.price)}</TableCell>
                              <TableCell className="text-white/70 text-xs">{item.location}</TableCell>
                              <TableCell className="text-white/50 text-xs">{formatDate(item.createdAt)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    disabled={isActing}
                                    onClick={() => handleToggleMarketplaceStatus(item)}
                                    className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                                      isSold
                                        ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                                        : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                                    }`}
                                  >
                                    {isActing ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                    )}
                                    {isSold ? "Mark as Active" : "Mark as Sold"}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isActing}
                                    onClick={() => handleDeleteListing(item.id, item.title)}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {isActing ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-3.5 w-3.5" />
                                    )}
                                    Delete
                                  </button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  )}
                </div>
              )}

              {/* Lost & Found Tab */}
              {activeTab === "lost-found" && (
                <div>
                  <div className="border-b border-white/5 px-6 py-4">
                    <h2 className="text-lg font-semibold text-white">Lost &amp; Found Moderation</h2>
                    <p className="mt-1 text-xs text-white/40">
                      Manage, mark status, or delete reported lost and found items on campus
                    </p>
                  </div>

                  {lostFoundListings.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                      <p className="text-sm text-white/50">No lost &amp; found listings recorded.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/5 hover:bg-transparent">
                          <TableHead className="text-white/50">Item</TableHead>
                          <TableHead className="text-white/50">Type</TableHead>
                          <TableHead className="text-white/50">Status</TableHead>
                          <TableHead className="text-white/50">Reporter</TableHead>
                          <TableHead className="text-white/50">Location</TableHead>
                          <TableHead className="text-white/50">Listed Date</TableHead>
                          <TableHead className="text-right text-white/50">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lostFoundListings.map((item) => {
                          const isActing = actingOnId === item.id
                          const isLost = item.type === "lost"
                          const isResolved = item.status === "resolved"

                          return (
                            <TableRow key={item.id} className="border-white/5 hover:bg-white/[0.02]">
                              <TableCell className="font-medium text-white/90">
                                <div className="flex items-center gap-3">
                                  {item.imageUrl ? (
                                    <ZoomableImage
                                      src={item.imageUrl}
                                      alt={item.title}
                                      className="h-full w-full object-cover"
                                      containerClassName="h-10 w-10 shrink-0 rounded-lg border border-white/10"
                                    />
                                  ) : (
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs text-white/40">
                                      No Img
                                    </div>
                                  )}
                                  <div>
                                    <Link
                                      href={`/lost-and-found/${item.id}`}
                                      className="font-medium text-white hover:text-purple-300 transition-colors"
                                    >
                                      {item.title}
                                    </Link>
                                    <p className="text-xs text-white/40 line-clamp-1">{item.description || "No description"}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span
                                  className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-bold uppercase ${
                                    isLost ? "bg-amber-500/20 text-amber-300" : "bg-purple-500/20 text-purple-300"
                                  }`}
                                >
                                  {item.type}
                                </span>
                              </TableCell>
                              <TableCell>
                                {isResolved ? (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-300 border border-emerald-500/30">
                                    <CheckCircle2 className="h-3 w-3" /> ✓ Resolved
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/20 px-2 py-0.5 text-[11px] font-bold text-purple-300 border border-purple-500/30">
                                    Active
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-white/70">
                                <div>
                                  <p className="text-xs font-medium text-white/80">{item.listerName}</p>
                                  <p className="text-[11px] text-white/40">{item.listerEmail || "No email"}</p>
                                </div>
                              </TableCell>
                              <TableCell className="text-white/70 text-xs">{item.location}</TableCell>
                              <TableCell className="text-white/50 text-xs">{formatDate(item.createdAt)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    disabled={isActing}
                                    onClick={() => handleToggleLostFoundStatus(item)}
                                    className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                                      isResolved
                                        ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                                        : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                                    }`}
                                  >
                                    {isActing ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                    )}
                                    {isResolved ? "Mark as Active" : "Mark as Resolved"}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isActing}
                                    onClick={() => handleDeleteLostFoundListing(item.id, item.title)}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {isActing ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-3.5 w-3.5" />
                                    )}
                                    Delete
                                  </button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  )}
                </div>
              )}

              {/* Suggestions Tab */}
              {activeTab === "suggestions" && (
                <div>
                  <div className="border-b border-white/5 px-6 py-4">
                    <h2 className="text-lg font-semibold text-white">Suggestions &amp; Q&amp;A Moderation</h2>
                    <p className="mt-1 text-xs text-white/40">
                      Manage campus questions and answers, review posted images, or delete inappropriate content
                    </p>
                  </div>

                  {suggestionsListings.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                      <p className="text-sm text-white/50">No suggestions or questions posted.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {suggestionsListings.map((q) => {
                        const isActingQ = actingOnId === q.id
                        const isExpanded = expandedQuestionIds.has(q.id)

                        return (
                          <div key={q.id} className="p-6 transition-colors hover:bg-white/[0.01]">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="space-y-2 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="rounded-md bg-purple-500/20 px-2 py-0.5 text-[11px] font-bold text-purple-300 border border-purple-500/30">
                                    {getCategoryLabel(q.category)}
                                  </span>
                                  {q.images && q.images.length > 0 && (
                                    <span className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-0.5 text-[11px] text-white/50">
                                      <ImageIcon className="h-3 w-3 text-purple-400" />
                                      {q.images.length} image{q.images.length !== 1 ? "s" : ""}
                                    </span>
                                  )}
                                  <span className="text-xs text-white/40">
                                    Posted by <strong className="text-white/70">{q.authorName}</strong> · {formatDate(q.createdAt)}
                                  </span>
                                </div>

                                <Link
                                  href={`/suggestions/${q.id}`}
                                  className="text-base font-semibold text-white hover:text-purple-300 transition-colors block"
                                >
                                  {q.question}
                                </Link>

                                {/* Question Images Preview */}
                                {q.images && q.images.length > 0 && (
                                  <div className="flex flex-wrap gap-2 pt-1">
                                    {q.images.map((imgUrl, i) => (
                                      <ZoomableImage
                                        key={i}
                                        src={imgUrl}
                                        alt={`Question image ${i + 1}`}
                                        className="h-full w-full object-cover"
                                        containerClassName="aspect-square w-14 rounded-lg border border-white/10 bg-[#1a1a26]"
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2 self-start pt-1 sm:pt-0">
                                <button
                                  type="button"
                                  onClick={() => toggleExpandQuestion(q.id)}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10 transition-colors"
                                >
                                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                  <span>{q.answers?.length ?? 0} Answers</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={isActingQ}
                                  onClick={() => handleDeleteAdminQuestion(q.id, q.question)}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                                >
                                  {isActingQ ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                  Delete Question
                                </button>
                              </div>
                            </div>

                            {/* Expandable Answers Section */}
                            {isExpanded && (
                              <div className="mt-4 border-t border-white/5 pt-4 pl-4 sm:pl-6 space-y-3">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-purple-400">
                                  Answers ({q.answers?.length ?? 0})
                                </h4>

                                {!q.answers || q.answers.length === 0 ? (
                                  <p className="text-xs text-white/40 italic">No answers posted for this question yet.</p>
                                ) : (
                                  <div className="space-y-2">
                                    {q.answers.map((ans) => {
                                      const isActingAns = actingOnId === ans.id

                                      return (
                                        <div
                                          key={ans.id}
                                          className="flex flex-col gap-2 rounded-xl border border-white/5 bg-[#181824] p-3 sm:flex-row sm:items-start sm:justify-between"
                                        >
                                          <div className="space-y-1.5 flex-1">
                                            <p className="text-xs text-white/40">
                                              Answered by <strong className="text-white/70">{ans.authorName}</strong> · {formatDate(ans.createdAt)}
                                            </p>
                                            <p className="text-xs text-white/90 whitespace-pre-wrap leading-relaxed">{ans.answer}</p>
                                            {ans.images && ans.images.length > 0 && (
                                              <div className="flex flex-wrap gap-1.5 pt-1">
                                                {ans.images.map((imgUrl, i) => (
                                                  <ZoomableImage
                                                    key={i}
                                                    src={imgUrl}
                                                    alt={`Answer image ${i + 1}`}
                                                    className="h-full w-full object-cover"
                                                    containerClassName="aspect-square w-10 rounded-md border border-white/10 bg-[#1a1a26]"
                                                  />
                                                ))}
                                              </div>
                                            )}
                                          </div>

                                          <button
                                            type="button"
                                            disabled={isActingAns}
                                            onClick={() => handleDeleteAdminAnswer(q.id, ans.id)}
                                            className="inline-flex items-center gap-1 self-start rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[11px] font-medium text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                                          >
                                            {isActingAns ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                            Delete Answer
                                          </button>
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
