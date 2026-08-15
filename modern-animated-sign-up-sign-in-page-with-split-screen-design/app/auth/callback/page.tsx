"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { handleAuthCallback } from "@/lib/auth/auth-service"

export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const completeSignIn = async () => {
      const result = await handleAuthCallback()

      if (result.error || !result.user) {
        setError(result.error ?? "Authentication failed")
        setTimeout(() => router.replace("/?mode=login"), 2500)
        return
      }

      router.replace(
        result.user.approvalStatus === "pending" ? "/pending-approval" : "/marketplace"
      )
    }

    completeSignIn()
  }, [router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#1a1a24] px-4">
      {error ? (
        <>
          <p className="text-center text-sm text-red-400/90">{error}</p>
          <p className="text-center text-xs text-white/40">Redirecting to login…</p>
        </>
      ) : (
        <>
          <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
          <p className="text-sm text-white/50">Completing sign in…</p>
        </>
      )}
    </div>
  )
}
