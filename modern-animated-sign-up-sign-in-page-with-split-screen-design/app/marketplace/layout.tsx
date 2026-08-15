import { AppHeader } from "@/components/app-header"
import { MARKETPLACE_DISCLAIMER } from "@/lib/marketplace/constants"

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#1a1a24]">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      <footer className="border-t border-white/5 py-6">
        <p className="text-center text-xs text-white/30">{MARKETPLACE_DISCLAIMER}</p>
      </footer>
    </div>
  )
}
