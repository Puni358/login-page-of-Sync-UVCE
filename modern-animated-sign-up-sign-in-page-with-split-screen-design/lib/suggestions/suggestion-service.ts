import { supabase } from "@/lib/supabaseClient"
import type {
  CreateAnswerInput,
  CreateQuestionInput,
  SuggestionAnswer,
  SuggestionCategory,
  SuggestionQuestion,
} from "./types"

export const SUGGESTION_CATEGORIES: {
  id: SuggestionCategory
  label: string
  description: string
}[] = [
  { id: "Academics", label: "Academics", description: "Courses, exams, and study help" },
  { id: "Clubs", label: "Clubs", description: "Student clubs and societies" },
  { id: "Resources", label: "Resources", description: "Campus resources and facilities" },
  { id: "Nearby Places", label: "Nearby Places", description: "Food, stay, and nearby spots" },
  { id: "General", label: "General", description: "General questions and campus life" },
]

export function getCategoryLabel(category: string): string {
  const match = SUGGESTION_CATEGORIES.find(
    (c) => c.id.toLowerCase() === category.toLowerCase() || c.label.toLowerCase() === category.toLowerCase()
  )
  return match?.label ?? category
}

export async function getQuestions(filters?: {
  category?: string
  search?: string
}): Promise<SuggestionQuestion[]> {
  let query = supabase
    .from("suggestions")
    .select(`
      id,
      user_id,
      category,
      question,
      created_at,
      profiles:user_id (
        full_name,
        email
      ),
      suggestion_images (
        id,
        image_url
      ),
      suggestion_answers (
        id,
        suggestion_id,
        user_id,
        answer,
        created_at,
        profiles:user_id (
          full_name,
          email
        ),
        answer_images (
          id,
          image_url
        )
      )
    `)
    .order("created_at", { ascending: false })

  if (filters?.category && filters.category !== "all") {
    query = query.ilike("category", filters.category)
  }

  let { data, error } = await query

  if (error) {
    console.error("Failed to fetch suggestions with join, trying fallback:", error.message)
    let fallbackQuery = supabase
      .from("suggestions")
      .select("*")
      .order("created_at", { ascending: false })

    if (filters?.category && filters.category !== "all") {
      fallbackQuery = fallbackQuery.ilike("category", filters.category)
    }

    const fallback = await fallbackQuery
    if (fallback.error) {
      console.error("Failed to fetch suggestions fallback:", fallback.error.message)
      return []
    }
    data = fallback.data
  }

  const result: SuggestionQuestion[] = (data || []).map((row: any) => {
    const rawProfile = row.profiles
    const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile

    const rawImgs = row.suggestion_images || []
    const qImages = (Array.isArray(rawImgs) ? rawImgs : []).map((i: any) => i.image_url)

    const rawAnswers = row.suggestion_answers || []
    const answers: SuggestionAnswer[] = (Array.isArray(rawAnswers) ? rawAnswers : [])
      .map((ansRow: any) => {
        const ansProfile = Array.isArray(ansRow.profiles) ? ansRow.profiles[0] : ansRow.profiles
        const rawAnsImgs = ansRow.answer_images || []
        const aImages = (Array.isArray(rawAnsImgs) ? rawAnsImgs : []).map((i: any) => i.image_url)

        return {
          id: ansRow.id,
          suggestionId: ansRow.suggestion_id,
          userId: ansRow.user_id,
          authorName: ansProfile?.full_name?.trim() || "Student",
          answer: ansRow.answer,
          createdAt: ansRow.created_at,
          images: aImages,
        }
      })
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

    return {
      id: row.id,
      userId: row.user_id,
      authorName: profile?.full_name?.trim() || "Student",
      category: row.category,
      question: row.question,
      createdAt: row.created_at,
      answers,
      images: qImages,
    }
  })

  if (filters?.search?.trim()) {
    const q = filters.search.trim().toLowerCase()
    return result.filter(
      (item) =>
        item.question.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.answers.some((a) => a.answer.toLowerCase().includes(q))
    )
  }

  return result
}

export async function getQuestionById(id: string): Promise<SuggestionQuestion | null> {
  const { data, error } = await supabase
    .from("suggestions")
    .select(`
      id,
      user_id,
      category,
      question,
      created_at,
      profiles:user_id (
        full_name,
        email
      ),
      suggestion_images (
        id,
        image_url
      ),
      suggestion_answers (
        id,
        suggestion_id,
        user_id,
        answer,
        created_at,
        profiles:user_id (
          full_name,
          email
        ),
        answer_images (
          id,
          image_url
        )
      )
    `)
    .eq("id", id)
    .maybeSingle()

  if (error || !data) {
    if (error) {
      console.error("Failed to fetch suggestion by id with join, trying fallback:", error.message)
      const fallback = await supabase
        .from("suggestions")
        .select("*")
        .eq("id", id)
        .maybeSingle()
      if (fallback.error || !fallback.data) return null
      const row = fallback.data

      const { data: qImgs } = await supabase
        .from("suggestion_images")
        .select("image_url")
        .eq("suggestion_id", id)

      const { data: answersData } = await supabase
        .from("suggestion_answers")
        .select("*")
        .eq("suggestion_id", id)
        .order("created_at", { ascending: true })

      return {
        id: row.id,
        userId: row.user_id,
        authorName: "Student",
        category: row.category,
        question: row.question,
        createdAt: row.created_at,
        images: (qImgs || []).map((i: any) => i.image_url),
        answers: (answersData || []).map((ans: any) => ({
          id: ans.id,
          suggestionId: ans.suggestion_id,
          userId: ans.user_id,
          authorName: "Student",
          answer: ans.answer,
          createdAt: ans.created_at,
          images: [],
        })),
      }
    }
    return null
  }

  const rawProfile = (data as any).profiles
  const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile

  const rawImgs = (data as any).suggestion_images || []
  const qImages = (Array.isArray(rawImgs) ? rawImgs : []).map((i: any) => i.image_url)

  const rawAnswers = (data as any).suggestion_answers || []
  const answers: SuggestionAnswer[] = (Array.isArray(rawAnswers) ? rawAnswers : [])
    .map((ansRow: any) => {
      const ansProfile = Array.isArray(ansRow.profiles) ? ansRow.profiles[0] : ansRow.profiles
      const rawAnsImgs = ansRow.answer_images || []
      const aImages = (Array.isArray(rawAnsImgs) ? rawAnsImgs : []).map((i: any) => i.image_url)

      return {
        id: ansRow.id,
        suggestionId: ansRow.suggestion_id,
        userId: ansRow.user_id,
        authorName: ansProfile?.full_name?.trim() || "Student",
        answer: ansRow.answer,
        createdAt: ansRow.created_at,
        images: aImages,
      }
    })
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  return {
    id: data.id,
    userId: data.user_id,
    authorName: profile?.full_name?.trim() || "Student",
    category: data.category,
    question: data.question,
    createdAt: data.created_at,
    answers,
    images: qImages,
  }
}

export async function createQuestion(
  input: CreateQuestionInput,
  userId: string
): Promise<SuggestionQuestion> {
  const { data, error } = await supabase
    .from("suggestions")
    .insert({
      user_id: userId,
      category: input.category,
      question: input.question.trim(),
    })
    .select(`
      id,
      user_id,
      category,
      question,
      created_at,
      profiles:user_id (
        full_name
      )
    `)
    .single()

  if (error || !data) {
    console.error("Error creating suggestion:", error?.message)
    throw new Error(error?.message || "Failed to post question")
  }

  if (input.images && input.images.length > 0) {
    const imgRows = input.images.map((url) => ({
      suggestion_id: data.id,
      image_url: url,
    }))
    const { error: imgErr } = await supabase.from("suggestion_images").insert(imgRows)
    if (imgErr) console.error("Error inserting suggestion_images:", imgErr.message)
  }

  const rawProfile = (data as any).profiles
  const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile

  return {
    id: data.id,
    userId: data.user_id,
    authorName: profile?.full_name?.trim() || "Student",
    category: data.category,
    question: data.question,
    createdAt: data.created_at,
    answers: [],
    images: input.images || [],
  }
}

export async function addAnswer(
  input: CreateAnswerInput,
  userId: string
): Promise<SuggestionAnswer> {
  const { data, error } = await supabase
    .from("suggestion_answers")
    .insert({
      suggestion_id: input.questionId,
      user_id: userId,
      answer: input.answer.trim(),
    })
    .select(`
      id,
      suggestion_id,
      user_id,
      answer,
      created_at,
      profiles:user_id (
        full_name
      )
    `)
    .single()

  if (error || !data) {
    console.error("Error adding answer:", error?.message)
    throw new Error(error?.message || "Failed to post answer")
  }

  if (input.images && input.images.length > 0) {
    const imgRows = input.images.map((url) => ({
      answer_id: data.id,
      image_url: url,
    }))
    const { error: imgErr } = await supabase.from("answer_images").insert(imgRows)
    if (imgErr) console.error("Error inserting answer_images:", imgErr.message)
  }

  const rawProfile = (data as any).profiles
  const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile

  return {
    id: data.id,
    suggestionId: data.suggestion_id,
    userId: data.user_id,
    authorName: profile?.full_name?.trim() || "Student",
    answer: data.answer,
    createdAt: data.created_at,
    images: input.images || [],
  }
}

export async function deleteQuestion(questionId: string): Promise<boolean> {
  // 1. Fetch answers to delete answer_images
  const { data: answers } = await supabase
    .from("suggestion_answers")
    .select("id")
    .eq("suggestion_id", questionId)

  if (answers && answers.length > 0) {
    const answerIds = answers.map((a) => a.id)
    await supabase.from("answer_images").delete().in("answer_id", answerIds)
  }

  // 2. Delete suggestion_answers
  await supabase.from("suggestion_answers").delete().eq("suggestion_id", questionId)

  // 3. Delete suggestion_images
  await supabase.from("suggestion_images").delete().eq("suggestion_id", questionId)

  // 4. Delete suggestion
  const { error } = await supabase.from("suggestions").delete().eq("id", questionId)

  if (error) {
    console.error("Failed to delete suggestion:", error.message)
    throw new Error(error.message)
  }
  return true
}

export async function deleteAnswer(answerId: string): Promise<boolean> {
  await supabase.from("answer_images").delete().eq("answer_id", answerId)
  const { error } = await supabase.from("suggestion_answers").delete().eq("id", answerId)

  if (error) {
    console.error("Failed to delete suggestion answer:", error.message)
    throw new Error(error.message)
  }
  return true
}
