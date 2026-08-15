import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-white/10 bg-[#12121a] px-6 py-16 text-center",
        className
      )}
    >
      {Icon && (
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <p className="text-white/60">{title}</p>
      {description && <p className="mt-2 text-sm text-white/35">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
