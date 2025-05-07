"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowLeft, User, Calendar, Tag } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { useTranslation } from "@/lib/translation-context"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"

// Note: This component must be used within LanguageProvider and TranslationProvider
// to access translations from en.json and ur.json
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
  const { language, isRTL } = useLanguage()
  const { t } = useTranslation()
  const router = useRouter()
  const params = useParams()
  const questionId = params.id as string

  useEffect(() => {
    if (questionId) {
      fetchQuestion()
    }
  }, [questionId])

  const fetchQuestion = async () => {
    try {
      const questionDoc = await getDoc(doc(db, "questions", questionId))

      if (!questionDoc.exists()) {
        setError(t("questionDetail.notFound"))
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
        setError(t("questionDetail.noPermission"))
        return
      }

      setQuestion({
        id: questionDoc.id,
        title: data.title || t("questionDetail.untitled"),
        question: data.question || "",
        answer: data.answer,
        userId: data.userId || "",
        userName: data.userName || t("common.anonymous"),
        status: data.status || "pending",
        category: data.category || "general",
        categoryName: data.categoryName || t("categories.category_general"),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate(),
        assignedTo: data.assignedTo,
        scholarName: data.scholarName,
        answeredAt: data.answeredAt?.toDate(),
        language: data.language || "en",
      })
    } catch (error) {
      console.error("Error fetching question:", error)
      setError(t("questionDetail.errorLoading"))
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
      <div className="container flex h-[calc(100vh-200px)] items-center justify-center" dir={isRTL ? "rtl" : "ltr"}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !question) {
    return (
      <div className="container py-10" dir={isRTL ? "rtl" : "ltr"}>
        <Card>
          <CardHeader>
            <CardTitle>{t("common.error")}</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")} className="w-full">
              {t("questionDetail.returnToHome")}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-10" dir={isRTL ? "rtl" : "ltr"}>
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t("common.back")}
      </Button>

      <Card>
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
              <Badge>{t(`common.${question.language === "en" ? "english" : "urdu"}`)}</Badge>
              {question.status === "answered" && (
                <Badge className="bg-green-500">{t("questionDetail.statusAnswered")}</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">{t("questionDetail.questionLabel")}</h3>
            <div className="rounded-md bg-muted p-4">
              <p className="whitespace-pre-line">{question.question}</p>
            </div>
          </div>

          {question.status === "answered" && question.answer && (
            <div>
              <h3 className="text-lg font-semibold mb-2">{t("questionDetail.answerLabel")}</h3>
              <div className="rounded-md bg-green-50 p-4 border border-green-100">
                <div className="mb-2 text-sm text-muted-foreground">
                  <span className="font-medium">{t("questionDetail.answeredBy")}</span>
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
              <p>{t("questionDetail.pendingReview")}</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          {user?.role === "admin" && question.status === "pending" && (
            <div className="flex gap-2">
              <Button onClick={() => router.push(`/admin/questions`)}>
                {t("questionDetail.manageInAdminPanel")}
              </Button>
            </div>
          )}
          {user?.role === "scholar" && question.status === "approved" && question.assignedTo === user.uid && (
            <Button onClick={() => router.push(`/scholar/answer/${question.id}`)}>
              {t("questionDetail.answerThisQuestion")}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}