"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Clock, LogOut, Mail } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"

export default function PendingApprovalPage() {
  const router = useRouter()
  const { user, isLoading, isPending, isApproved, logout } = useAuth()

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/?mode=login")
    } else if (!isLoading && isApproved) {
      router.replace("/marketplace")
    }
  }, [isLoading, user, isApproved, router])

  if (isLoading || !user || !isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1a1a24]">
        <div className="h-8 w-8 animate-pulse rounded-full bg-purple-500/30" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1a1a24] px-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/5 bg-[#12121a] p-8 shadow-2xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400">
          <Clock className="h-8 w-8" />
        </div>

        <h1 className="text-center text-2xl font-bold text-white">Pending Approval</h1>
        <p className="mt-3 text-center text-sm leading-relaxed text-white/50">
          Thanks for signing up, {user.firstName}! Your account is waiting for admin approval.
          You&apos;ll get access to Sync - UVCE once an administrator reviews your registration.
        </p>

        <div className="mt-6 space-y-3 rounded-xl border border-white/5 bg-[#1a1a26] p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/40">Name</span>
            <span className="font-medium text-white/80">
              {user.firstName} {user.lastName}
            </span>
          </div>
          {user.usn && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/40">USN</span>
              <span className="font-medium text-white/80">{user.usn}</span>
            </div>
          )}
          {user.phone && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/40">Phone</span>
              <span className="font-medium text-white/80">{user.phone}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/40">Email</span>
            <span className="font-medium text-white/80">{user.email}</span>
          </div>
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-purple-400" />
          <p className="text-xs leading-relaxed text-white/50">
            We&apos;ll notify you at your registered email once your account has been approved.
            This usually takes 1–2 business days.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={logout}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/70 transition-colors hover:border-white/20 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
          <Link
            href="/"
            className="inline-flex flex-1 items-center justify-center rounded-xl bg-purple-500/20 px-4 py-2.5 text-sm font-medium text-purple-300 transition-colors hover:bg-purple-500/30"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
