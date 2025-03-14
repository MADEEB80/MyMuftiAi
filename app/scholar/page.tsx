"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { collection, query, where, getDocs, orderBy, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

// Scholar check - in a real app, you'd store scholar status in Firestore
const SCHOLAR_EMAILS = ["scholar@mymufti.com"]

export default function ScholarPage() {
  const [isScholar, setIsScholar] = useState(false)
  const [loading, setLoading] = useState(true)
  const [pendingQuestions, setPendingQuestions] = useState<any[]>([])
  const [answeredQuestions, setAnsweredQuestions] = useState<any[]>([])
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null)
  const [answer, setAnswer] = useState("")

  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Check if current user is a scholar
    if (user && SCHOLAR_EMAILS.includes(user.email || "")) {
      setIsScholar(true)
      fetchQuestions()
    } else {
      setLoading(false)
    }
  }, [user])

  const fetchQuestions = async () => {
    try {
      // Fetch pending questions assigned to this scholar
      const pendingQuery = query(
        collection(db, "questions"),
        where("status", "==", "approved"),
        where("assignedTo", "==", user?.uid || "unassigned"),
        orderBy("createdAt", "desc"),
      )

      const pendingSnapshot = await getDocs(pendingQuery)
      const pendingData: any[] = []

      pendingSnapshot.forEach((doc) => {
        pendingData.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })
      })

      setPendingQuestions(pendingData)

      // Fetch answered questions by this scholar
      const answeredQuery = query(
        collection(db, "questions"),
        where("status", "==", "answered"),
        where("answeredBy", "==", user?.uid || ""),
        orderBy("answeredAt", "desc"),
      )

      const answeredSnapshot = await getDocs(answeredQuery)
      const answeredData: any[] = []

      answeredSnapshot.forEach((doc) => {
        answeredData.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          answeredAt: doc.data().answeredAt?.toDate() || new Date(),
        })
      })

      setAnsweredQuestions(answeredData)
    } catch (error) {
      console.error("Error fetching questions:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitAnswer = async () => {
    if (!selectedQuestion || !answer.trim()) return

    try {
      await updateDoc(doc(db, "questions", selectedQuestion.id), {
        status: "answered",
        answer,
        answeredBy: user?.uid,
        scholarName: user?.displayName,
        answeredAt: new Date(),
        updatedAt: new Date(),
      })

      // Update local state
      setPendingQuestions((prev) => prev.filter((q) => q.id !== selectedQuestion.id))

      setAnsweredQuestions((prev) => [
        {
          ...selectedQuestion,
          status: "answered",
          answer,
          answeredBy: user?.uid,
          scholarName: user?.displayName,
          answeredAt: new Date(),
        },
        ...prev,
      ])

      // Reset form
      setSelectedQuestion(null)
      setAnswer("")
    } catch (error) {
      console.error("Error submitting answer:", error)
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

  if (!isScholar) {
    return (
      <div className="container py-10">
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You do not have permission to access the scholar dashboard.</CardDescription>
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
      <h1 className="mb-8 text-3xl font-bold">Scholar Dashboard</h1>

      {selectedQuestion ? (
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">{selectedQuestion.title}</CardTitle>
                <CardDescription className="mt-1">
                  From: {selectedQuestion.userName} on {formatDate(selectedQuestion.createdAt)}
                </CardDescription>
              </div>
              <Badge>{selectedQuestion.category.charAt(0).toUpperCase() + selectedQuestion.category.slice(1)}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="mb-2 font-semibold">Question:</h3>
              <div className="rounded-md bg-muted p-4">
                <p className="whitespace-pre-line">{selectedQuestion.question}</p>
              </div>
            </div>

            <div>
              <h3 className="mb-2 font-semibold">Your Answer:</h3>
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer here..."
                className="min-h-[200px]"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedQuestion(null)
                  setAnswer("")
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmitAnswer} disabled={!answer.trim()}>
                Submit Answer
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="pending">Pending Questions</TabsTrigger>
            <TabsTrigger value="answered">Answered Questions</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Questions Awaiting Your Response</CardTitle>
                <CardDescription>Review and answer questions assigned to you</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingQuestions.length === 0 ? (
                  <div className="flex h-40 items-center justify-center">
                    <p className="text-muted-foreground">No pending questions assigned to you</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingQuestions.map((question) => (
                      <Card key={question.id}>
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg">{question.title}</CardTitle>
                            <Badge>{question.category.charAt(0).toUpperCase() + question.category.slice(1)}</Badge>
                          </div>
                          <CardDescription>
                            From: {question.userName} on {formatDate(question.createdAt)}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <p className="line-clamp-3 text-sm text-muted-foreground">{question.question}</p>
                        </CardContent>
                        <CardContent className="flex justify-end pt-0">
                          <Button size="sm" onClick={() => setSelectedQuestion(question)}>
                            Answer Question
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="answered">
            <Card>
              <CardHeader>
                <CardTitle>Questions You've Answered</CardTitle>
                <CardDescription>Review your previous answers</CardDescription>
              </CardHeader>
              <CardContent>
                {answeredQuestions.length === 0 ? (
                  <div className="flex h-40 items-center justify-center">
                    <p className="text-muted-foreground">You haven't answered any questions yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {answeredQuestions.map((question) => (
                      <Card key={question.id}>
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg">{question.title}</CardTitle>
                            <Badge>{question.category.charAt(0).toUpperCase() + question.category.slice(1)}</Badge>
                          </div>
                          <CardDescription>Answered on: {formatDate(question.answeredAt)}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="mb-2">
                            <h4 className="text-sm font-medium">Question:</h4>
                            <p className="line-clamp-2 text-sm text-muted-foreground">{question.question}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium">Your Answer:</h4>
                            <p className="line-clamp-3 text-sm text-muted-foreground">{question.answer}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

