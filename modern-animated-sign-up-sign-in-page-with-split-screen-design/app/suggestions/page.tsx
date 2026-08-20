"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, Search, MessageCircleQuestion, Lock } from "lucide-react"
import { QuestionCard } from "@/components/suggestions/question-card"
import { EmptyState } from "@/components/ui/empty-state"
import { PageLoader } from "@/components/ui/page-loader"
import { getQuestions, SUGGESTION_CATEGORIES } from "@/lib/suggestions/suggestion-service"
import type { SuggestionQuestion } from "@/lib/suggestions/types"
import { useAuth } from "@/lib/auth/auth-context"
import { cn } from "@/lib/utils"

export default function SuggestionsPage() {
  const { isAuthenticated } = useAuth()
  const [questions, setQuestions] = useState<SuggestionQuestion[]>([])
  const [category, setCategory] = useState<string>("all")
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    getQuestions({ category, search })
      .then(setQuestions)
      .finally(() => setIsLoading(false))
  }, [category, search])

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-white/5 bg-gradient-to-br from-[#12121a] to-[#1a1028] p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Suggestions &amp; Q&amp;A</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/50 sm:text-base">
          Ask questions about academics, clubs, campus resources, and nearby spots. Answers are visible to everyone.
        </p>
        {isAuthenticated ? (
          <Link
            href="/suggestions/ask"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-purple-500 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-purple-500/25 hover:bg-purple-400 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Ask a Question
          </Link>
        ) : (
          <Link
            href="/?redirect=/suggestions/ask&mode=login"
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-5 py-2.5 text-sm font-medium text-purple-300 transition-all hover:bg-purple-500/20"
          >
            <Lock className="h-4 w-4 text-purple-400" />
            Login to Ask a Question
          </Link>
        )}
      </section>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategory("all")}
          className={cn(
            "rounded-xl px-4 py-2 text-sm font-medium transition-all cursor-pointer",
            category === "all"
              ? "bg-purple-500 text-white shadow-lg shadow-purple-500/25"
              : "border border-white/5 bg-[#1a1a26] text-white/60 hover:text-white"
          )}
        >
          All
        </button>
        {SUGGESTION_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategory(cat.id)}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-medium transition-all cursor-pointer",
              category.toLowerCase() === cat.id.toLowerCase()
                ? "bg-purple-500 text-white shadow-lg shadow-purple-500/25"
                : "border border-white/5 bg-[#1a1a26] text-white/60 hover:text-white"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search questions and answers..."
          className="w-full rounded-xl border border-white/5 bg-[#12121a] py-3 pl-11 pr-4 text-sm text-white placeholder-white/30 focus:border-purple-500/70 focus:outline-none focus:ring-2 focus:ring-purple-500/25"
        />
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Questions</h2>
          <span className="text-sm text-white/40">{questions.length} question{questions.length !== 1 ? "s" : ""}</span>
        </div>

        {isLoading ? (
          <PageLoader />
        ) : questions.length === 0 ? (
          <EmptyState
            icon={MessageCircleQuestion}
            title="No questions yet"
            description="Be the first to ask about academics, clubs, or campus life."
            action={
              isAuthenticated ? (
                <Link
                  href="/suggestions/ask"
                  className="inline-flex items-center gap-2 text-sm font-medium text-purple-400 hover:text-purple-300"
                >
                  <Plus className="h-4 w-4" />
                  Ask a question
                </Link>
              ) : (
                <Link
                  href="/?redirect=/suggestions/ask&mode=login"
                  className="text-sm font-medium text-purple-400 hover:text-purple-300"
                >
                  Login to ask a question
                </Link>
              )
            }
          />
        ) : (
          <div className="space-y-4">
            {questions.map((q) => (
              <QuestionCard key={q.id} question={q} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
