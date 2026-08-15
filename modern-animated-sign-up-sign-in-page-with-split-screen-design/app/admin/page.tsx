"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Check, Loader2, Shield, X } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { fetchPendingProfiles, updateProfileStatus } from "@/lib/auth/admin-service"
import type { Profile } from "@/lib/auth/types"
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

  const [pendingUsers, setPendingUsers] = useState<Profile[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actingOnId, setActingOnId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const loadPendingUsers = useCallback(async () => {
    setIsLoadingUsers(true)
    setLoadError(null)
    try {
      const users = await fetchPendingProfiles()
      setPendingUsers(users)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load pending users")
    } finally {
      setIsLoadingUsers(false)
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
    loadPendingUsers()
  }, [authLoading, isAdmin, loadPendingUsers])

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
              <p className="text-sm text-white/50">Review and manage pending user registrations</p>
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

        <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#12121a] shadow-2xl">
          <div className="border-b border-white/5 px-6 py-4">
            <h2 className="text-lg font-semibold text-white">Pending Users</h2>
            <p className="mt-1 text-xs text-white/40">
              {pendingUsers.length} registration{pendingUsers.length !== 1 ? "s" : ""} awaiting
              review
            </p>
          </div>

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

          {isLoadingUsers ? (
            <div className="flex items-center justify-center px-6 py-12">
              <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
            </div>
          ) : pendingUsers.length === 0 ? (
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
                {pendingUsers.map((user) => {
                  const isActing = actingOnId === user.id

                  return (
                    <TableRow key={user.id} className="border-white/5 hover:bg-white/[0.02]">
                      <TableCell className="font-medium text-white/90">
                        {displayValue(user.full_name)}
                      </TableCell>
                      <TableCell className="text-white/70">{displayValue(user.email)}</TableCell>
                      <TableCell className="text-white/70">{displayValue(user.usn)}</TableCell>
                      <TableCell className="text-white/70">
                        {displayValue(user.phone_number)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            disabled={isActing}
                            onClick={() => handleStatusUpdate(user.id, "approved")}
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
                            onClick={() => handleStatusUpdate(user.id, "rejected")}
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
      </div>
    </div>
  )
}
