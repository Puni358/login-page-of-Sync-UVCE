import Link from "next/link"
import { ArrowLeft, Shield } from "lucide-react"

export default function AdminPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#1a1a24] px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/5 bg-[#12121a] p-8 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/15 text-purple-400">
          <Shield className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
        <p className="mt-3 text-sm text-white/50">Coming soon</p>
        <p className="mt-1 text-xs text-white/30">
          Moderation, analytics, and user management will be available here.
        </p>
        <Link
          href="/marketplace"
          className="mt-6 inline-flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sync - UVCE
        </Link>
      </div>
    </div>
  )
}
