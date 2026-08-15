import Link from "next/link"
import { MessageCircle } from "lucide-react"
import type { SuggestionQuestion } from "@/lib/suggestions/types"
import { getCategoryLabel } from "@/lib/suggestions/suggestion-service"

interface QuestionCardProps {
  question: SuggestionQuestion
}

export function QuestionCard({ question }: QuestionCardProps) {
  return (
    <Link
      href={`/suggestions/${question.id}`}
      className="group block rounded-2xl border border-white/5 bg-[#12121a] p-5 transition-all hover:border-purple-500/25 hover:shadow-[0_8px_32px_rgba(168,85,247,0.1)]"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-lg bg-purple-500/15 px-2.5 py-1 text-xs font-medium text-purple-300">
          {getCategoryLabel(question.category)}
        </span>
        <span className="flex items-center gap-1 text-xs text-white/35">
          <MessageCircle className="h-3.5 w-3.5" />
          {question.answers.length}
        </span>
      </div>
      <h3 className="mt-3 text-base font-semibold text-white group-hover:text-purple-300 transition-colors">
        {question.title}
      </h3>
      <p className="mt-2 line-clamp-2 text-sm text-white/45">{question.body}</p>
      <p className="mt-4 text-xs text-white/30">
        Asked by {question.authorName} · {new Date(question.createdAt).toLocaleDateString("en-IN")}
      </p>
    </Link>
  )
}
