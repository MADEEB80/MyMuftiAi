"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getAllCategories } from "@/lib/category-service"
import { useTranslation } from "@/lib/translation-context"
import type { Category } from "@/types/category"

export default function CategoryBrowser() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const { t, language } = useTranslation()

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true)
        const fetchedCategories = await getAllCategories(language)
        setCategories(fetchedCategories)
      } catch (error) {
        console.error("Error fetching categories:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [language])

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {categories.map((category) => (
        <Link key={category.id} href={`/categories/${category.slug}`}>
          <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">{category.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{category.description}</p>
              <p className="text-sm text-gray-500">
                {t("categories.questionCount", { count: category.questionCount || 0 })}
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
