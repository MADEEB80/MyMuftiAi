"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, CheckCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"

interface Question {
  id: string
  title: string
  question: string
  answer: string
  userId: string
  userName: string
  status: string
  category: string
  categoryName?: string
  createdAt: Date
  answeredAt: Date
  answeredBy: string
  scholarName?: string
  language: string
}

export default function ScholarAnsweredQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  const { user, userRole } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && userRole === "scholar") {
      fetchAnsweredQuestions()
    } else if (!loading) {
      router.push("/")
    }
  }, [user, userRole, loading, router])

  useEffect(() => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      setFilteredQuestions(
        questions.filter(
          (q) =>
            q.title.toLowerCase().includes(term) ||
            q.question.toLowerCase().includes(term) ||
            q.answer.toLowerCase().includes(term) ||
            q.userName.toLowerCase().includes(term),
        ),
      )
    } else {
      setFilteredQuestions(questions)
    }
  }, [searchTerm, questions])

  const fetchAnsweredQuestions = async () => {
    if (!user) return

    try {
      // Simplified query to avoid requiring a composite index
      const q = query(collection(db, "questions"), where("answeredBy", "==", user.uid), orderBy("answeredAt", "desc"))
      const querySnapshot = await getDocs(q)
      const fetchedQuestions: Question[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()

        // Client-side filtering for status
        if (data.status === "answered") {
          fetchedQuestions.push({
            id: doc.id,
            title: data.title || "Untitled",
            question: data.question || "",
            answer: data.answer || "",
            userId: data.userId || "",
            userName: data.userName || "Anonymous",
            status: data.status || "answered",
            category: data.category || "general",
            categoryName: data.categoryName || "General",
            createdAt: data.createdAt?.toDate() || new Date(),
            answeredAt: data.answeredAt?.toDate() || new Date(),
            answeredBy: data.answeredBy || user.uid,
            scholarName: data.scholarName || user.displayName,
            language: data.language || "en",
          })
        }
      })

      setQuestions(fetchedQuestions)
      setFilteredQuestions(fetchedQuestions)
    } catch (error) {
      console.error("Error fetching answered questions:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date)
  }

  if (loading) {
    return (
      <div className="container flex h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user || userRole !== "scholar") {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You do not have permission to access this page.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")} className="w-full">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Questions You've Answered</h1>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search questions..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Questions List */}
      {filteredQuestions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <p className="text-muted-foreground mb-4">You haven't answered any questions yet.</p>
            <Button onClick={() => router.push("/scholar/questions")}>View Assigned Questions</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((question) => (
            <Card key={question.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{question.title}</CardTitle>
                    <CardDescription>Answered on: {formatDate(question.answeredAt)}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Answered
                    </Badge>
                    <Badge>{question.language === "en" ? "English" : "Urdu"}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-1">Question:</h3>
                  <p className="line-clamp-2 text-muted-foreground">{question.question}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-1">Your Answer:</h3>
                  <p className="line-clamp-3 text-muted-foreground">{question.answer}</p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button variant="outline" onClick={() => router.push(`/questions/${question.id}`)}>
                  View Full Question
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
