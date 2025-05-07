"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getRecentAnsweredQuestionsByLanguage, type Question } from "@/lib/question-service"
import { useTranslation } from "@/lib/translation-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function RecentQuestions() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const { t, language } = useTranslation()

  useEffect(() => {
    async function fetchRecentQuestions() {
      setLoading(true)
      try {
        const recentQuestions = await getRecentAnsweredQuestionsByLanguage(language, 5)
        setQuestions(recentQuestions)
      } catch (error) {
        console.error("Error fetching recent questions:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentQuestions()
  }, [language])

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {questions.length > 0 ? (
        questions.map((question) => (
          <Link href={`/questions/${question.id}`} key={question.id}>
            <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{question.title}</CardTitle>
                <CardDescription>
                  {t("by")} {question.userName} • {question.createdAt?.toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-2 text-sm text-gray-600">{question.content}</p>
                <div className="mt-2">
                  <Badge variant="outline">{question.categoryName}</Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">{t("no_recent_questions")}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
