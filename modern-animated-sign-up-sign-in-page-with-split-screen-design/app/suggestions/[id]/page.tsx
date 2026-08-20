"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { ZoomableImage } from "@/components/ui/lightbox-context"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, ImagePlus, Loader2, Lock, Trash2, X } from "lucide-react"
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

const MAX_ANSWER_IMAGES = 2

export default function QuestionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [question, setQuestion] = useState<SuggestionQuestion | null>(null)
  const [answerText, setAnswerText] = useState("")
  const [answerImages, setAnswerImages] = useState<string[]>([])
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (selectedFiles.length === 0) return

    const remainingSlots = MAX_ANSWER_IMAGES - answerImages.length
    if (remainingSlots <= 0) return

    const filesToProcess = selectedFiles.slice(0, remainingSlots)

    filesToProcess.forEach((file) => {
      if (!file.type.startsWith("image/")) return
      if (file.size > 5 * 1024 * 1024) return

      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === "string") {
          const imgUrl = reader.result
          setAnswerImages((prev) => {
            if (prev.length >= MAX_ANSWER_IMAGES) return prev
            return [...prev, imgUrl]
          })
        }
      }
      reader.readAsDataURL(file)
    })

    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const removeAnswerImage = (indexToRemove: number) => {
    setAnswerImages((prev) => prev.filter((_, idx) => idx !== indexToRemove))
  }

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
      await addAnswer({ questionId, answer: answerText, images: answerImages }, user.id)
      setAnswerText("")
      setAnswerImages([])
      await loadQuestion()
    } catch (err: any) {
      setError(err?.message || "Failed to post answer")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteQuestion = async () => {
    if (!question || !user) return
    if (!window.confirm("Are you sure you want to delete your question?")) return

    setIsDeletingQuestion(true)
    try {
      await deleteQuestion(question.id)
      router.push("/suggestions")
    } catch (err: any) {
      alert(err?.message || "Failed to delete question")
      setIsDeletingQuestion(false)
    }
  }

  const handleDeleteAnswer = async (answerId: string) => {
    if (!user) return
    if (!window.confirm("Are you sure you want to delete your answer?")) return

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

  // Restrict elevated admin actions on public page — only true owner can delete here
  const canDeleteQuestion = user && user.id === question.userId

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
        
        {/* Question Images */}
        {question.images && question.images.length > 0 && (
          <div className="flex flex-wrap gap-3 pt-2">
            {question.images.map((imgUrl, i) => (
              <ZoomableImage
                key={i}
                src={imgUrl}
                alt={`Question image ${i + 1}`}
                className="h-full w-full object-cover"
                containerClassName="aspect-video w-48 rounded-xl border border-white/10 bg-[#1a1a26]"
              />
            ))}
          </div>
        )}

        <p className="text-xs text-white/35 pt-2">
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
              // Restrict elevated admin actions on public page — only true owner can delete here
              const canDeleteAns = user && user.id === ans.userId
              const isDeletingThisAns = deletingAnswerId === ans.id

              return (
                <div key={ans.id} className="group relative rounded-xl border border-white/5 bg-[#12121a] p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-3">
                      <p className="text-sm leading-relaxed text-white/90 whitespace-pre-wrap">{ans.answer}</p>
                      {/* Answer Images */}
                      {ans.images && ans.images.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {ans.images.map((imgUrl, i) => (
                            <ZoomableImage
                              key={i}
                              src={imgUrl}
                              alt={`Answer image ${i + 1}`}
                              className="h-full w-full object-cover"
                              containerClassName="aspect-video w-36 rounded-lg border border-white/10 bg-[#1a1a26]"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    {canDeleteAns && (
                      <button
                        type="button"
                        onClick={() => handleDeleteAnswer(ans.id)}
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
          <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400">
                <Lock className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-base font-semibold text-white">Login to Answer &amp; Participate</h4>
                <p className="mt-1 text-sm text-white/50">
                  Suggestions and campus Q&amp;A are open for everyone to view. Sign in to post an answer to this question.
                </p>
                <Link
                  href={`/?redirect=${encodeURIComponent(`/suggestions/${questionId}`)}&mode=login`}
                  className="mt-4 inline-flex items-center justify-center rounded-xl bg-purple-500 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-purple-500/25 transition-all hover:bg-purple-400 hover:shadow-purple-500/40"
                >
                  Login to Answer
                </Link>
              </div>
            </div>
          </div>
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

            {/* Answer Images Upload (up to 2) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-white/70">Attach Images (up to 2)</span>
                <span className="text-xs text-white/40">{answerImages.length} of {MAX_ANSWER_IMAGES}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {answerImages.map((imgUrl, idx) => (
                  <div key={idx} className="relative aspect-square w-20 overflow-hidden rounded-lg border border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imgUrl} alt={`Answer upload ${idx + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeAnswerImage(idx)}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white hover:bg-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}

                {answerImages.length < MAX_ANSWER_IMAGES && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex aspect-square w-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-white/15 bg-[#1a1a26] text-white/40 hover:border-purple-500/50 hover:text-purple-400 transition-all"
                  >
                    <ImagePlus className="h-4 w-4" />
                    <span className="text-[10px]">Add photo</span>
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageSelect}
              />
            </div>

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
