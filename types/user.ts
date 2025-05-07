// User type definition
export interface User {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  role: "user" | "scholar" | "admin"
  createdAt: Date
  lastLogin: Date
  bio?: string
  language?: "en" | "ur"
}
