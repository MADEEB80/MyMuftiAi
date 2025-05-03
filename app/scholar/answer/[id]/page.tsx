"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { db } from "@/lib/firebase"
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore"
import { createNotification } from "@/lib/notification-service"

interface Question {
  id: string
  title: string
  question: string
  userId: string
  userName: string
  status: string
  category: string
  categoryName?: string
  createdAt: Date
  assignedTo?: string
  scholarName?: string
  language: string
}

export default function ScholarAnswerPage() {
  const [question, setQuestion] = useState<Question | null>(null)
  const [answer, setAnswer] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { user, userRole } = useAuth()
  const router = useRouter()
  const params = useParams()
  const questionId = params.id as string

  useEffect(() => {
    if (user && userRole === "scholar") {
      fetchQuestion()
    } else if (!loading) {
      router.push("/")
    }
  }, [user, userRole, loading, router, questionId])

  const fetchQuestion = async () => {
    if (!questionId) return

    try {
      const questionDoc = await getDoc(doc(db, "questions", questionId))

      if (!questionDoc.exists()) {
        setError("Question not found")
        return
      }

      const data = questionDoc.data()

      // Check if question is assigned to this scholar
      if (data.assignedTo !== user?.uid) {
        setError("This question is not assigned to you")
        return
      }

      // Check if question is in the correct status
      if (data.status !== "approved") {
        setError("This question cannot be answered at this time")
        return
      }

      setQuestion({
        id: questionDoc.id,
        title: data.title || "Untitled",
        question: data.question || "",
        userId: data.userId || "",
        userName: data.userName || "Anonymous",
        status: data.status || "approved",
        category: data.category || "general",
        categoryName: data.categoryName || "General",
        createdAt: data.createdAt?.toDate() || new Date(),
        assignedTo: data.assignedTo || undefined,
        scholarName: data.scholarName || undefined,
        language: data.language || "en",
      })
    } catch (error) {
      console.error("Error fetching question:", error)
      setError("Failed to load question")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitAnswer = async () => {
    if (!question || !answer.trim() || !user) return

    setSubmitting(true)
    setError(null)

    try {
      await updateDoc(doc(db, "questions", question.id), {
        status: "answered",
        answer,
        answeredBy: user.uid,
        scholarName: user.displayName,
        answeredAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })

      // Notify the user who asked the question
      await createNotification({
        userId: question.userId,
        type: "question_answered",
        title: "Your question has been answered",
        message: `Your question "${question.title}" has been answered by ${user.displayName}.`,
        relatedId: question.id,
      })

      setSuccess(true)

      // Redirect after a short delay
      setTimeout(() => {
        router.push("/scholar/dashboard")
      }, 2000)
    } catch (error) {
      console.error("Error submitting answer:", error)
      setError("Failed to submit answer. Please try again.")
    } finally {
      setSubmitting(false)
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

  if (error && !question) {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/scholar/dashboard")} className="w-full">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user || userRole !== "scholar" || !question) {
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
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{question.title}</CardTitle>
              <CardDescription className="mt-1">
                From: {question.userName} on {formatDate(question.createdAt)}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge>{question.categoryName}</Badge>
              <Badge>{question.language === "en" ? "English" : "Urdu"}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Question:</h3>
            <div className="rounded-md bg-muted p-4">
              <p className="whitespace-pre-line">{question.question}</p>
            </div>
          </div>

          {success ? (
            <div className="rounded-md bg-green-50 p-4 text-green-800 border border-green-200">
              <h3 className="font-semibold">Answer Submitted Successfully!</h3>
              <p>You will be redirected to your dashboard shortly.</p>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-semibold mb-2">Your Answer:</h3>
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder={`Type your answer here in ${question.language === "en" ? "English" : "Urdu"}...`}
                className="min-h-[200px]"
              />
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/scholar/questions")} disabled={submitting}>
            Back to Questions
          </Button>
          {!success && (
            <Button onClick={handleSubmitAnswer} disabled={!answer.trim() || submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Answer"
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
