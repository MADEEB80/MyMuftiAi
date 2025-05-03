"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowLeft, User, Calendar, Tag } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { useLanguage } from "@/lib/language-context"

interface Question {
  id: string
  title: string
  question: string
  answer?: string
  userId: string
  userName: string
  status: string
  category: string
  categoryName?: string
  createdAt: Date
  updatedAt?: Date
  assignedTo?: string
  scholarName?: string
  answeredAt?: Date
  language: string
}

export default function QuestionDetailPage() {
  const [question, setQuestion] = useState<Question | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const questionId = params.id as string
  const { language } = useLanguage()

  useEffect(() => {
    if (questionId) {
      fetchQuestion()
    }
  }, [questionId])

  const fetchQuestion = async () => {
    try {
      const questionDoc = await getDoc(doc(db, "questions", questionId))

      if (!questionDoc.exists()) {
        setError("Question not found")
        return
      }

      const data = questionDoc.data()

      // Check if the question is public (answered) or belongs to the current user
      if (
        data.status !== "answered" &&
        data.userId !== user?.uid &&
        user?.role !== "admin" &&
        user?.role !== "scholar"
      ) {
        setError("You do not have permission to view this question")
        return
      }

      setQuestion({
        id: questionDoc.id,
        title: data.title || "Untitled",
        question: data.question || "",
        answer: data.answer,
        userId: data.userId || "",
        userName: data.userName || "Anonymous",
        status: data.status || "pending",
        category: data.category || "general",
        categoryName: data.categoryName || "General",
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate(),
        assignedTo: data.assignedTo,
        scholarName: data.scholarName,
        answeredAt: data.answeredAt?.toDate(),
        language: data.language || "en",
      })
    } catch (error) {
      console.error("Error fetching question:", error)
      setError("Failed to load question")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(language === "en" ? "en-US" : "ur-PK", {
      year: "numeric",
      month: "long",
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

  if (error || !question) {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>{language === "en" ? "Error" : "خرابی"}</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")} className="w-full">
              {language === "en" ? "Return to Home" : "واپس ہوم پر جائیں"}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        {language === "en" ? "Back" : "واپس"}
      </Button>

      <Card className={language === "ur" ? "rtl" : ""}>
        <CardHeader>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="text-2xl">{question.title}</CardTitle>
              <div className="flex items-center mt-2 text-muted-foreground text-sm gap-2">
                <User className="h-4 w-4" />
                <span>{question.userName}</span>
                <span className="mx-1">•</span>
                <Calendar className="h-4 w-4" />
                <span>{formatDate(question.createdAt)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {question.categoryName}
              </Badge>
              <Badge>{question.language === "en" ? "English" : "اردو"}</Badge>
              {question.status === "answered" && (
                <Badge className="bg-green-500">{language === "en" ? "Answered" : "جواب دیا گیا"}</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">{language === "en" ? "Question:" : "سوال:"}</h3>
            <div className="rounded-md bg-muted p-4">
              <p className="whitespace-pre-line">{question.question}</p>
            </div>
          </div>

          {question.status === "answered" && question.answer && (
            <div>
              <h3 className="text-lg font-semibold mb-2">{language === "en" ? "Answer:" : "جواب:"}</h3>
              <div className="rounded-md bg-green-50 p-4 border border-green-100">
                <div className="mb-2 text-sm text-muted-foreground">
                  <span className="font-medium">{language === "en" ? "Answered by: " : "جواب دینے والا: "}</span>
                  {question.scholarName}
                  {question.answeredAt && (
                    <>
                      <span className="mx-1">•</span>
                      {formatDate(question.answeredAt)}
                    </>
                  )}
                </div>
                <p className="whitespace-pre-line">{question.answer}</p>
              </div>
            </div>
          )}

          {question.status !== "answered" && user?.uid === question.userId && (
            <div className="rounded-md bg-amber-50 p-4 border border-amber-100">
              <p>
                {language === "en"
                  ? "Your question is currently being reviewed. You will be notified when it is answered."
                  : "آپ کے سوال کا جائزہ لیا جا رہا ہے۔ جب اس کا جواب دیا جائے گا تو آپ کو مطلع کیا جائے گا۔"}
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          {user?.role === "admin" && question.status === "pending" && (
            <div className="flex gap-2">
              <Button onClick={() => router.push(`/admin/questions`)}>
                {language === "en" ? "Manage in Admin Panel" : "ایڈمن پینل میں منظم کریں"}
              </Button>
            </div>
          )}
          {user?.role === "scholar" && question.status === "approved" && question.assignedTo === user.uid && (
            <Button onClick={() => router.push(`/scholar/answer/${question.id}`)}>
              {language === "en" ? "Answer This Question" : "اس سوال کا جواب دیں"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
