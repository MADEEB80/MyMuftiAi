"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getAllCategories } from "@/lib/category-service"
import { useLanguage } from "@/lib/language-context"
import { useTranslation } from "@/lib/translation-context"
import type { Category } from "@/types/category"

export function CategoryBrowser() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { language, isRTL } = useLanguage()
  const { t } = useTranslation()

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true)
        setError(null)
        const fetchedCategories = await getAllCategories(language)
        setCategories(fetchedCategories)
      } catch (error) {
        console.error("Error fetching categories:", error)
        setError(t("common.error"))
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [language, t])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="p-6">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center p-6">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  // Use the translation function for category count
  const questionCountText = (count: number) => {
    return t("categories.questionCount", { count })
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${isRTL ? "rtl" : ""}`}>
      {categories.length === 0 ? (
        <div className="col-span-full text-center p-6">
          <p className="text-muted-foreground">{t("common.noQuestionsFound")}</p>
        </div>
      ) : (
        categories.map((category) => (
          <Link key={category.id} href={`/categories?category=${category.value || category.id}`}>
            <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-2">{category.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{category.description}</p>
                <p className="text-sm text-gray-500">{questionCountText(category.questionCount || 0)}</p>
              </CardContent>
            </Card>
          </Link>
        ))
      )}
    </div>
  )
}
