"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import { SUGGESTION_CATEGORIES, createQuestion } from "@/lib/suggestions/suggestion-service"
import { cn } from "@/lib/utils"

export default function AskQuestionPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()
  const [category, setCategory] = useState("")
  const [questionText, setQuestionText] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/?redirect=/suggestions/ask&mode=login")
    }
  }, [isAuthenticated, isLoading, router])

  const inputClass = (hasError: boolean) =>
    cn(
      "w-full rounded-xl border bg-[#1a1a26] px-4 py-3 text-sm text-white placeholder-white/30 focus:border-purple-500/70 focus:outline-none focus:ring-2 focus:ring-purple-500/25",
      hasError ? "border-red-400/50" : "border-white/5"
    )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!category) next.category = "Select a category"
    if (!questionText.trim()) next.questionText = "Question text is required"
    setErrors(next)
    if (Object.keys(next).length > 0 || !user || !category) return

    setIsSubmitting(true)
    try {
      const newQuestion = await createQuestion(
        { category, question: questionText },
        user.id
      )
      router.push(`/suggestions/${newQuestion.id}`)
    } catch (err: any) {
      setErrors({ form: err?.message || "Failed to submit question. Please try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

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
      <Link href="/suggestions" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to Suggestions
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-white">Ask a Question</h1>
        <p className="mt-1 text-sm text-white/50">Your question will be visible to all students across UVCE.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-white/5 bg-[#12121a] p-6 sm:p-8">
        {errors.form && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
            {errors.form}
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="category" className="text-sm font-medium text-white/80">Category</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={cn(inputClass(!!errors.category), "appearance-none cursor-pointer")}
          >
            <option value="" disabled className="bg-[#1a1a26]">Select category</option>
            {SUGGESTION_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id} className="bg-[#1a1a26]">
                {cat.label} — {cat.description}
              </option>
            ))}
          </select>
          {errors.category && <p className="text-xs text-red-400">{errors.category}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="questionText" className="text-sm font-medium text-white/80">Your Question</label>
          <textarea
            id="questionText"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            rows={5}
            placeholder="What would you like to ask or suggest?"
            className={cn(inputClass(!!errors.questionText), "resize-none")}
          />
          {errors.questionText && <p className="text-xs text-red-400">{errors.questionText}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-500 py-3 text-sm font-medium text-white hover:bg-purple-400 disabled:opacity-70 transition-colors shadow-lg shadow-purple-500/20"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Posting Question...
            </>
          ) : (
            "Post Question"
          )}
        </button>
      </form>
    </div>
  )
}
