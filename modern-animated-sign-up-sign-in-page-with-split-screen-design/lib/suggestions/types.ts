export type SuggestionCategory =
  | "club"
  | "academics"
  | "resources"
  | "events"
  | "campus-life"
  | "career"
  | "other"

export type SuggestionAnswer = {
  id: string
  body: string
  authorId: string
  authorName: string
  createdAt: string
}

export type SuggestionQuestion = {
  id: string
  category: SuggestionCategory
  title: string
  body: string
  authorId: string
  authorName: string
  createdAt: string
  answers: SuggestionAnswer[]
}

export type CreateQuestionInput = {
  category: SuggestionCategory
  title: string
  body: string
}

export type CreateAnswerInput = {
  questionId: string
  body: string
}
