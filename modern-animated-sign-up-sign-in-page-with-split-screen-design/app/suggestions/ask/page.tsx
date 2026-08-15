"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import { SUGGESTION_CATEGORIES } from "@/lib/suggestions/suggestion-service"
import { createQuestion } from "@/lib/suggestions/suggestion-service"
import type { SuggestionCategory } from "@/lib/suggestions/types"
import { useState } from "react"
import { cn } from "@/lib/utils"

export default function AskQuestionPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()
  const [category, setCategory] = useState<SuggestionCategory | "">("")
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
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
    if (!title.trim()) next.title = "Title is required"
    if (!body.trim()) next.body = "Question is required"
    setErrors(next)
    if (Object.keys(next).length > 0 || !user || !category) return

    setIsSubmitting(true)
    try {
      const question = await createQuestion(
        { category, title, body },
        { id: user.id, name: `${user.firstName} ${user.lastName}` }
      )
      router.push(`/suggestions/${question.id}`)
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
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-white">Ask a Question</h1>
        <p className="mt-1 text-sm text-white/50">Your question will be visible to all students.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-white/5 bg-[#12121a] p-6 sm:p-8">
        <div className="space-y-1.5">
          <label htmlFor="category" className="text-sm font-medium text-white/80">Category</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as SuggestionCategory)}
            className={cn(inputClass(!!errors.category), "appearance-none")}
          >
            <option value="" disabled>Select category</option>
            {SUGGESTION_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id} className="bg-[#1a1a26]">
                {cat.label} — {cat.description}
              </option>
            ))}
          </select>
          {errors.category && <p className="text-xs text-red-400">{errors.category}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="title" className="text-sm font-medium text-white/80">Question title</label>
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. How do I join the robotics club?"
            className={inputClass(!!errors.title)}
          />
          {errors.title && <p className="text-xs text-red-400">{errors.title}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="body" className="text-sm font-medium text-white/80">Your question</label>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            placeholder="Provide details so others can help..."
            className={cn(inputClass(!!errors.body), "resize-none")}
          />
          {errors.body && <p className="text-xs text-red-400">{errors.body}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-500 py-3 text-sm font-medium text-white hover:bg-purple-400 disabled:opacity-70"
        >
          {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Posting...</> : "Post Question"}
        </button>
      </form>
    </div>
  )
}
