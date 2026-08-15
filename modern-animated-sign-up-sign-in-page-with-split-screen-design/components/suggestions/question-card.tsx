import Link from "next/link"
import { Image as ImageIcon, MessageCircle } from "lucide-react"
import type { SuggestionQuestion } from "@/lib/suggestions/types"
import { getCategoryLabel } from "@/lib/suggestions/suggestion-service"

interface QuestionCardProps {
  question: SuggestionQuestion
}

export function QuestionCard({ question }: QuestionCardProps) {
  const formattedDate = question.createdAt
    ? new Date(question.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : ""

  const hasImages = question.images && question.images.length > 0

  return (
    <Link
      href={`/suggestions/${question.id}`}
      className="group block rounded-2xl border border-white/5 bg-[#12121a] p-5 transition-all hover:border-purple-500/25 hover:shadow-[0_8px_32px_rgba(168,85,247,0.1)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-purple-500/15 px-2.5 py-1 text-xs font-medium text-purple-300">
            {getCategoryLabel(question.category)}
          </span>
          {hasImages && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 text-xs text-white/50" title={`${question.images?.length} attached image(s)`}>
              <ImageIcon className="h-3 w-3 text-purple-400" />
              <span>{question.images?.length}</span>
            </span>
          )}
        </div>
        <span className="flex items-center gap-1 text-xs text-white/35">
          <MessageCircle className="h-3.5 w-3.5" />
          {question.answers?.length ?? 0} {question.answers?.length === 1 ? "answer" : "answers"}
        </span>
      </div>

      <div className="mt-3 flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-white group-hover:text-purple-300 transition-colors line-clamp-3 leading-relaxed">
            {question.question}
          </h3>
        </div>
        {hasImages && question.images?.[0] && (
          <div className="relative aspect-square w-16 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#1a1a26]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={question.images[0]} alt="" className="h-full w-full object-cover" />
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-white/30">
        Asked by <span className="text-white/60 font-medium">{question.authorName}</span>
        {formattedDate && ` · ${formattedDate}`}
      </p>
    </Link>
  )
}
