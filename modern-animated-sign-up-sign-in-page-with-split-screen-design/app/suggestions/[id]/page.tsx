"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Trash2 } from "lucide-react"
import {
  addAnswer,
  getCategoryLabel,
  getQuestionById,
  deleteQuestion,
  deleteAnswer,
} from "@/lib/suggestions/suggestion-service"
import type { SuggestionQuestion } from "@/lib/suggestions/types"
import { useAuth } from "@/lib/auth/auth-context"
import { cn } from "@/lib/utils"

export default function QuestionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isAuthenticated, isAdmin } = useAuth()
  const [question, setQuestion] = useState<SuggestionQuestion | null>(null)
  const [answerText, setAnswerText] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeletingQuestion, setIsDeletingQuestion] = useState(false)
  const [deletingAnswerId, setDeletingAnswerId] = useState<string | null>(null)
  const [error, setError] = useState("")

  const questionId = params.id as string

  const loadQuestion = useCallback(async () => {
    setIsLoading(true)
    try {
      const q = await getQuestionById(questionId)
      setQuestion(q)
    } finally {
      setIsLoading(false)
    }
  }, [questionId])

  useEffect(() => {
    loadQuestion()
  }, [loadQuestion])

  const handlePostAnswer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
      router.push(`/?redirect=${encodeURIComponent(`/suggestions/${questionId}`)}&mode=login`)
      return
    }
    if (!answerText.trim() || !user) {
      setError("Answer cannot be empty")
      return
    }

    setIsSubmitting(true)
    setError("")
    try {
      await addAnswer({ questionId, answer: answerText }, user.id)
      setAnswerText("")
      await loadQuestion()
    } catch (err: any) {
      setError(err?.message || "Failed to post answer")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteQuestion = async () => {
    if (!question || !user) return
    const isOwner = user.id === question.userId
    const promptMsg = isAdmin && !isOwner
      ? "As an Admin, are you sure you want to delete this question?"
      : "Are you sure you want to delete your question?"

    if (!window.confirm(promptMsg)) return

    setIsDeletingQuestion(true)
    try {
      await deleteQuestion(question.id)
      router.push("/suggestions")
    } catch (err: any) {
      alert(err?.message || "Failed to delete question")
      setIsDeletingQuestion(false)
    }
  }

  const handleDeleteAnswer = async (answerId: string, answerUserId: string) => {
    if (!user) return
    const isOwner = user.id === answerUserId
    const promptMsg = isAdmin && !isOwner
      ? "As an Admin, are you sure you want to delete this answer?"
      : "Are you sure you want to delete your answer?"

    if (!window.confirm(promptMsg)) return

    setDeletingAnswerId(answerId)
    try {
      await deleteAnswer(answerId)
      await loadQuestion()
    } catch (err: any) {
      alert(err?.message || "Failed to delete answer")
    } finally {
      setDeletingAnswerId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="h-6 w-36 animate-pulse rounded-lg bg-white/5" />
        <div className="h-64 animate-pulse rounded-2xl bg-white/5" />
      </div>
    )
  }

  if (!question) {
    return (
      <div className="rounded-2xl border border-white/5 bg-[#12121a] px-6 py-16 text-center">
        <p className="text-white/50">Question not found.</p>
        <Link href="/suggestions" className="mt-4 inline-flex items-center gap-2 text-sm text-purple-400">
          <ArrowLeft className="h-4 w-4" /> Back to Suggestions
        </Link>
      </div>
    )
  }

  const canDeleteQuestion = user && (user.id === question.userId || isAdmin)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/suggestions" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to Suggestions
        </Link>

        {canDeleteQuestion && (
          <button
            type="button"
            onClick={handleDeleteQuestion}
            disabled={isDeletingQuestion}
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
          >
            {isDeletingQuestion ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Delete Question
          </button>
        )}
      </div>

      <article className="rounded-2xl border border-white/5 bg-[#12121a] p-6 sm:p-8 space-y-4">
        <span className="inline-block rounded-lg bg-purple-500/15 px-2.5 py-1 text-xs font-semibold text-purple-300">
          {getCategoryLabel(question.category)}
        </span>
        <h1 className="text-xl font-bold text-white sm:text-2xl leading-relaxed">{question.question}</h1>
        <p className="text-xs text-white/35">
          Asked by <span className="text-white/60 font-medium">{question.authorName}</span> ·{" "}
          {new Date(question.createdAt).toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
      </article>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">
          Answers ({question.answers?.length ?? 0})
        </h2>

        {!question.answers || question.answers.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/10 bg-[#12121a] px-4 py-8 text-center text-sm text-white/45">
            No answers yet. Be the first to help!
          </p>
        ) : (
          <div className="space-y-3">
            {question.answers.map((ans) => {
              const canDeleteAns = user && (user.id === ans.userId || isAdmin)
              const isDeletingThisAns = deletingAnswerId === ans.id

              return (
                <div key={ans.id} className="group relative rounded-xl border border-white/5 bg-[#12121a] p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm leading-relaxed text-white/90 whitespace-pre-wrap">{ans.answer}</p>
                    {canDeleteAns && (
                      <button
                        type="button"
                        onClick={() => handleDeleteAnswer(ans.id, ans.userId)}
                        disabled={isDeletingThisAns}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-white/40 hover:text-red-400 disabled:opacity-50"
                        title="Delete Answer"
                      >
                        {isDeletingThisAns ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    )}
                  </div>
                  <p className="mt-3 text-xs text-white/35">
                    <span className="text-white/60 font-medium">{ans.authorName}</span> ·{" "}
                    {new Date(ans.createdAt).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-white/5 bg-[#12121a] p-6">
        <h3 className="mb-4 text-base font-semibold text-white">Your Answer</h3>
        {!isAuthenticated ? (
          <p className="text-sm text-white/50">
            <Link
              href={`/?redirect=${encodeURIComponent(`/suggestions/${questionId}`)}&mode=login`}
              className="text-purple-400 hover:text-purple-300 font-medium"
            >
              Login
            </Link>{" "}
            to post an answer.
          </p>
        ) : (
          <form onSubmit={handlePostAnswer} className="space-y-4">
            <textarea
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              rows={4}
              placeholder="Write your answer here..."
              className={cn(
                "w-full resize-none rounded-xl border border-white/5 bg-[#1a1a26] px-4 py-3 text-sm text-white placeholder-white/30 focus:border-purple-500/70 focus:outline-none focus:ring-2 focus:ring-purple-500/25"
              )}
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-purple-400 disabled:opacity-70 transition-colors shadow-lg shadow-purple-500/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Posting...
                </>
              ) : (
                "Post Answer"
              )}
            </button>
          </form>
        )}
      </section>
    </div>
  )
}
