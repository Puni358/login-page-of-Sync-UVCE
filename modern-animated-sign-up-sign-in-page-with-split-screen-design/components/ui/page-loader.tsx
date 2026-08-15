import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function PageLoader({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center py-24", className)}>
      <Loader2 className="h-8 w-8 animate-spin text-purple-400" aria-label="Loading" />
    </div>
  )
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-72 animate-pulse rounded-2xl border border-white/5 bg-[#12121a]" />
      ))}
    </div>
  )
}
