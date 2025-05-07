// Question type definition
export interface Question {
  id: string
  title: string
  content: string
  userId: string
  userName: string
  categoryId: string
  categoryName: string
  status: "pending" | "approved" | "rejected" | "answered"
  createdAt: Date
  updatedAt: Date
  language: "en" | "ur" // Language field
  answer?: Answer
}

// Answer type definition
export interface Answer {
  id: string
  content: string
  scholarId: string
  scholarName: string
  createdAt: Date
  references?: string[]
}
