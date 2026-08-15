"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { addAnswer, getCategoryLabel, getQuestionById } from "@/lib/suggestions/suggestion-service"
import type { SuggestionQuestion } from "@/lib/suggestions/types"
import { useAuth } from "@/lib/auth/auth-context"
import { cn } from "@/lib/utils"

export default function QuestionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [question, setQuestion] = useState<SuggestionQuestion | null>(null)
  const [answerBody, setAnswerBody] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const questionId = params.id as string

  const loadQuestion = () => {
    getQuestionById(questionId).then(setQuestion).finally(() => setIsLoading(false))
  }

  useEffect(() => {
    loadQuestion()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionId])

  const handleAnswer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
      router.push(`/?redirect=${encodeURIComponent(`/suggestions/${questionId}`)}&mode=login`)
      return
    }
    if (!answerBody.trim() || !user) {
      setError("Answer cannot be empty")
      return
    }

    setIsSubmitting(true)
    setError("")
    try {
      await addAnswer({ questionId, body: answerBody }, { id: user.id, name: `${user.firstName} ${user.lastName}` })
      setAnswerBody("")
      loadQuestion()
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <div className="h-96 animate-pulse rounded-2xl bg-white/5" />
  }

  if (!question) {
    return (
      <div className="rounded-2xl border border-white/5 bg-[#12121a] px-6 py-16 text-center">
        <p className="text-white/50">Question not found.</p>
        <Link href="/suggestions" className="mt-4 inline-flex items-center gap-2 text-sm text-purple-400">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/suggestions" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to Suggestions
      </Link>

      <article className="rounded-2xl border border-white/5 bg-[#12121a] p-6 sm:p-8">
        <span className="rounded-lg bg-purple-500/15 px-2.5 py-1 text-xs font-medium text-purple-300">
          {getCategoryLabel(question.category)}
        </span>
        <h1 className="mt-4 text-xl font-bold text-white sm:text-2xl">{question.title}</h1>
        <p className="mt-1 text-xs text-white/35">
          Asked by {question.authorName} · {new Date(question.createdAt).toLocaleString("en-IN")}
        </p>
        <p className="mt-4 text-sm leading-relaxed text-white/80 whitespace-pre-wrap">{question.body}</p>
      </article>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">
          Answers ({question.answers.length})
        </h2>

        {question.answers.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/10 bg-[#12121a] px-4 py-8 text-center text-sm text-white/45">
            No answers yet. Be the first to help!
          </p>
        ) : (
          <div className="space-y-3">
            {question.answers.map((answer) => (
              <div key={answer.id} className="rounded-xl border border-white/5 bg-[#12121a] p-4 sm:p-5">
                <p className="text-sm leading-relaxed text-white/80 whitespace-pre-wrap">{answer.body}</p>
                <p className="mt-3 text-xs text-white/35">
                  {answer.authorName} · {new Date(answer.createdAt).toLocaleString("en-IN")}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-white/5 bg-[#12121a] p-6">
        <h3 className="mb-4 text-base font-semibold text-white">Your Answer</h3>
        {!isAuthenticated ? (
          <p className="text-sm text-white/50">
            <Link
              href={`/?redirect=${encodeURIComponent(`/suggestions/${questionId}`)}&mode=login`}
              className="text-purple-400 hover:text-purple-300"
            >
              Login
            </Link>{" "}
            to post an answer.
          </p>
        ) : (
          <form onSubmit={handleAnswer} className="space-y-4">
            <textarea
              value={answerBody}
              onChange={(e) => setAnswerBody(e.target.value)}
              rows={4}
              placeholder="Write your answer..."
              className={cn(
                "w-full resize-none rounded-xl border border-white/5 bg-[#1a1a26] px-4 py-3 text-sm text-white placeholder-white/30 focus:border-purple-500/70 focus:outline-none focus:ring-2 focus:ring-purple-500/25"
              )}
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-purple-400 disabled:opacity-70"
            >
              {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Posting...</> : "Post Answer"}
            </button>
          </form>
        )}
      </section>
    </div>
  )
}
