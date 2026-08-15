export type SuggestionCategory =
  | "Academics"
  | "Clubs"
  | "Resources"
  | "Nearby Places"
  | "General"
  | string

export type SuggestionAnswer = {
  id: string
  suggestionId: string
  userId: string
  authorName: string
  answer: string
  createdAt: string
  images?: string[]
}

export type SuggestionQuestion = {
  id: string
  userId: string
  authorName: string
  category: string
  question: string
  createdAt: string
  answers: SuggestionAnswer[]
  images?: string[]
}

export type CreateQuestionInput = {
  category: string
  question: string
  images?: string[]
}

export type CreateAnswerInput = {
  questionId: string
  answer: string
  images?: string[]
}
