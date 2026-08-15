import type {
  CreateAnswerInput,
  CreateQuestionInput,
  SuggestionAnswer,
  SuggestionCategory,
  SuggestionQuestion,
} from "./types"

const STORAGE_KEY = "sync_suggestions_questions"

export const SUGGESTION_CATEGORIES: {
  id: SuggestionCategory
  label: string
  description: string
}[] = [
  { id: "club", label: "Clubs", description: "Student clubs and societies" },
  { id: "academics", label: "Academics", description: "Courses, exams, and study help" },
  { id: "resources", label: "Resources", description: "Campus resources and facilities" },
  { id: "events", label: "Events", description: "Fests, workshops, and meetups" },
  { id: "campus-life", label: "Campus Life", description: "Hostels, food, and daily life" },
  { id: "career", label: "Career", description: "Internships, placements, and skills" },
  { id: "other", label: "Other", description: "Everything else" },
]

function readQuestions(): SuggestionQuestion[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SuggestionQuestion[]) : []
  } catch {
    return []
  }
}

function writeQuestions(questions: SuggestionQuestion[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(questions))
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export async function getQuestions(filters?: {
  category?: SuggestionCategory | "all"
  search?: string
}): Promise<SuggestionQuestion[]> {
  // TODO: replace with GET /api/suggestions
  let questions = readQuestions().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  if (filters?.category && filters.category !== "all") {
    questions = questions.filter((q) => q.category === filters.category)
  }

  if (filters?.search?.trim()) {
    const q = filters.search.trim().toLowerCase()
    questions = questions.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.body.toLowerCase().includes(q) ||
        item.answers.some((a) => a.body.toLowerCase().includes(q))
    )
  }

  return questions
}

export async function getQuestionById(id: string): Promise<SuggestionQuestion | null> {
  // TODO: replace with GET /api/suggestions/:id
  return readQuestions().find((q) => q.id === id) ?? null
}

export async function createQuestion(
  input: CreateQuestionInput,
  author: { id: string; name: string }
): Promise<SuggestionQuestion> {
  // TODO: replace with POST /api/suggestions
  const question: SuggestionQuestion = {
    id: generateId("q"),
    category: input.category,
    title: input.title.trim(),
    body: input.body.trim(),
    authorId: author.id,
    authorName: author.name,
    createdAt: new Date().toISOString(),
    answers: [],
  }
  const questions = readQuestions()
  questions.unshift(question)
  writeQuestions(questions)
  return question
}

export async function addAnswer(
  input: CreateAnswerInput,
  author: { id: string; name: string }
): Promise<SuggestionAnswer | null> {
  // TODO: replace with POST /api/suggestions/:id/answers
  const questions = readQuestions()
  const index = questions.findIndex((q) => q.id === input.questionId)
  if (index === -1) return null

  const answer: SuggestionAnswer = {
    id: generateId("a"),
    body: input.body.trim(),
    authorId: author.id,
    authorName: author.name,
    createdAt: new Date().toISOString(),
  }

  questions[index].answers.push(answer)
  writeQuestions(questions)
  return answer
}

export function getCategoryLabel(category: SuggestionCategory): string {
  return SUGGESTION_CATEGORIES.find((c) => c.id === category)?.label ?? category
}
