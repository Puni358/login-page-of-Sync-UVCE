import Link from "next/link"
import { ArrowRight, MapPin, Calendar } from "lucide-react"
import type { FoundItem } from "@/lib/lost-and-found/types"
import { ChatButton } from "@/components/chat/chat-button"

interface FoundItemCardProps {
  item: FoundItem
}

export function FoundItemCard({ item }: FoundItemCardProps) {
  const hasPhoto = item.photos.length > 0

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#12121a] transition-all hover:border-purple-500/25 hover:shadow-[0_8px_32px_rgba(168,85,247,0.12)]">
      <Link href={`/lost-and-found/${item.id}`} className="flex flex-1 flex-col">
        <div className="relative aspect-[4/3] overflow-hidden bg-[#1a1a26]">
          {hasPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.photos[0]} alt={item.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-white/30">No photo</div>
          )}
          <div className="absolute left-3 top-3 rounded-lg bg-black/50 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-purple-300 backdrop-blur-sm">
            Found Item
          </div>
        </div>
        <div className="flex flex-1 flex-col p-4">
          <h3 className="line-clamp-1 text-base font-semibold text-white group-hover:text-purple-300 transition-colors">
            {item.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-white/45">{item.description}</p>
          <div className="mt-3 space-y-1.5 text-xs text-white/40">
            <p className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-purple-400/70" />
              <span className="line-clamp-1">{item.foundWhere}</span>
            </p>
            <p className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-purple-400/70" />
              <span>{item.foundWhen}</span>
            </p>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs font-medium text-purple-400 opacity-0 transition-opacity group-hover:opacity-100">
            View details
            <ArrowRight className="h-3 w-3" />
          </div>
        </div>
      </Link>
      <div className="border-t border-white/5 px-4 py-3">
        <ChatButton
          itemId={item.id}
          itemType="lost-found"
          itemTitle={item.title}
          otherPartyName={item.listerName}
          variant="compact"
          className="w-full justify-center py-2"
        />
      </div>
    </div>
  )
}
