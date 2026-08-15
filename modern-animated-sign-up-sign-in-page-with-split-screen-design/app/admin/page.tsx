"use client"

import Link from "next/link"
import { ArrowLeft, Check, Shield, X } from "lucide-react"
import { useEffect, useState } from "react"
import { getPendingUsers } from "@/lib/auth/pending-users-store"
import type { PendingUser } from "@/lib/auth/types"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function AdminPage() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])

  useEffect(() => {
    setPendingUsers(getPendingUsers())
  }, [])

  return (
    <div className="min-h-screen bg-[#1a1a24] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
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

          {pendingUsers.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-white/50">No pending registrations at the moment.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-white/50">Name</TableHead>
                  <TableHead className="text-white/50">USN</TableHead>
                  <TableHead className="text-white/50">Phone</TableHead>
                  <TableHead className="text-right text-white/50">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingUsers.map((user) => (
                  <TableRow key={user.id} className="border-white/5 hover:bg-white/[0.02]">
                    <TableCell className="font-medium text-white/90">{user.name}</TableCell>
                    <TableCell className="text-white/70">{user.usn}</TableCell>
                    <TableCell className="text-white/70">{user.phone}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Approve
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20"
                        >
                          <X className="h-3.5 w-3.5" />
                          Reject
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-white/30">
          Approve/Reject actions are UI-only — backend logic coming soon.
        </p>
      </div>
    </div>
  )
}
