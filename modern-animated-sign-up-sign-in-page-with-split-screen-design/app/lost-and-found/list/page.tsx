"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"
import { ListFoundForm } from "@/components/lost-and-found/list-found-form"
import { useAuth } from "@/lib/auth/auth-context"

export default function ListFoundItemPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/?redirect=/lost-and-found/list&mode=login")
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/lost-and-found" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-white">List a Found Item</h1>
        <p className="mt-1 text-sm text-white/50">
          Help reunite lost items with their owners. Add photos and where/when you found it.
        </p>
      </div>
      <div className="rounded-2xl border border-white/5 bg-[#12121a] p-6 sm:p-8">
        <ListFoundForm />
      </div>
    </div>
  )
}
