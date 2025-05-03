"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { useTranslation } from "@/lib/translation-context"
import { getRecentAnsweredQuestions } from "@/lib/question-service"
import type { Question } from "@/types/question"

export function RecentQuestions() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { language, isRTL } = useLanguage()
  const { t } = useTranslation()

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true)
        setError(null)
        const recentQuestions = await getRecentAnsweredQuestions(language, 5)
        setQuestions(recentQuestions)
      } catch (error) {
        console.error("Error fetching recent questions:", error)
        setError(t("common.error"))
      } finally {
        setLoading(false)
      }
    }

    fetchQuestions()
  }, [language, t])

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return <p className="text-red-500">{error}</p>
  }

  if (questions.length === 0) {
    return <p>{t("common.noQuestionsFound")}</p>
  }

  const formatDate = (date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date)
    return dateObj.toLocaleDateString(language === "ur" ? "ur-PK" : "en-US")
  }

  return (
    <div className={`space-y-4 ${isRTL ? "rtl" : ""}`}>
      {questions.map((question) => (
        <div key={question.id} className="border-b pb-3">
          <Link href={`/questions/${question.id}`} className="block">
            <h3 className="font-medium hover:text-green-600 transition-colors">{question.title}</h3>
            <p className="text-sm text-gray-500">{formatDate(question.createdAt)}</p>
          </Link>
        </div>
      ))}
      <Link href="/search" className="text-green-600 hover:text-green-700 font-medium inline-block mt-2">
        {t("common.viewAllQuestions")} →
      </Link>
    </div>
  )
}
