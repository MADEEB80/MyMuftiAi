"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ChevronRight, AlertCircle, ExternalLink } from "lucide-react"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface Category {
  id: string
  name: string
  value: string
  description: string
  questionCount: number
}

interface Question {
  id: string
  title: string
  category: string
  createdAt: Date
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [indexError, setIndexError] = useState<string | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get("category")

  // Fetch all categories
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true)
      try {
        // First, try to get categories from the categories collection
        const categoriesQuery = query(collection(db, "categories"), orderBy("name", "asc"))
        const categoriesSnapshot = await getDocs(categoriesQuery)

        if (!categoriesSnapshot.empty) {
          const fetchedCategories: Category[] = []
          categoriesSnapshot.forEach((doc) => {
            const data = doc.data()
            fetchedCategories.push({
              id: doc.id,
              name: data.name || "Unknown",
              value: data.value || doc.id,
              description: data.description || "",
              questionCount: data.questionCount || 0,
            })
          })

          setCategories(fetchedCategories)

          // If there's a category in the URL, select it
          if (categoryParam && fetchedCategories.some((c) => c.value === categoryParam)) {
            setSelectedCategory(categoryParam)
          } else if (fetchedCategories.length > 0) {
            // Otherwise select the first category
            setSelectedCategory(fetchedCategories[0].value)
          }
        } else {
          // If no categories found, create default categories from questions
          const questionsQuery = query(collection(db, "questions"), where("status", "==", "answered"))

          const questionsSnapshot = await getDocs(questionsQuery)

          if (!questionsSnapshot.empty) {
            const categoryMap = new Map<string, number>()

            questionsSnapshot.forEach((doc) => {
              const data = doc.data()
              const category = data.category || "general"
              categoryMap.set(category, (categoryMap.get(category) || 0) + 1)
            })

            const defaultCategories: Category[] = []
            categoryMap.forEach((count, value) => {
              defaultCategories.push({
                id: value,
                name: value.charAt(0).toUpperCase() + value.slice(1),
                value: value,
                description: `Questions about ${value}`,
                questionCount: count,
              })
            })

            setCategories(defaultCategories)

            if (categoryParam && defaultCategories.some((c) => c.value === categoryParam)) {
              setSelectedCategory(categoryParam)
            } else if (defaultCategories.length > 0) {
              setSelectedCategory(defaultCategories[0].value)
            }
          }
        }
      } catch (error) {
        console.error("Error fetching categories:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [categoryParam])

  // Fetch questions when a category is selected
  useEffect(() => {
    if (!selectedCategory) return

    const fetchQuestions = async () => {
      setLoadingQuestions(true)
      setIndexError(null)

      try {
        // First try: Use a simpler query without orderBy to avoid index issues
        const q = query(
          collection(db, "questions"),
          where("status", "==", "answered"),
          where("category", "==", selectedCategory),
        )

        const querySnapshot = await getDocs(q)
        const fetchedQuestions: Question[] = []

        querySnapshot.forEach((doc) => {
          const data = doc.data()
          fetchedQuestions.push({
            id: doc.id,
            title: data.title,
            category: data.category,
            createdAt: data.createdAt?.toDate() || new Date(),
          })
        })

        // Sort client-side instead of using orderBy in the query
        fetchedQuestions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

        setQuestions(fetchedQuestions)
      } catch (error: any) {
        console.error("Error fetching questions:", error)

        // Check if it's an index error and extract the URL
        if (error.message && error.message.includes("index")) {
          const urlMatch = error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]+/)
          if (urlMatch) {
            setIndexError(urlMatch[0])
          } else {
            setIndexError("An index is required for this query. Please contact the administrator.")
          }
        }

        // Set empty questions array on error
        setQuestions([])
      } finally {
        setLoadingQuestions(false)
      }
    }

    fetchQuestions()

    // Update URL with the selected category
    router.push(`/categories?category=${selectedCategory}`, { scroll: false })
  }, [selectedCategory, router])

  const handleCategoryClick = (categoryValue: string) => {
    setSelectedCategory(categoryValue)
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

  const selectedCategoryData = categories.find((c) => c.value === selectedCategory)

  return (
    <div className="container py-10">
      <h1 className="mb-6 text-3xl font-bold">Browse by Category</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        {/* Categories Sidebar */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y">
                {categories.map((category) => (
                  <li key={category.id}>
                    <Button
                      variant="ghost"
                      className={`w-full justify-between rounded-none px-4 py-3 text-left ${
                        selectedCategory === category.value ? "bg-muted" : ""
                      }`}
                      onClick={() => handleCategoryClick(category.value)}
                    >
                      <span>{category.name}</span>
                      <span className="flex items-center">
                        <Badge variant="outline" className="mr-2">
                          {category.questionCount}
                        </Badge>
                        <ChevronRight className="h-4 w-4" />
                      </span>
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Questions List */}
        <div className="md:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>{selectedCategoryData?.name || "Questions"}</CardTitle>
              <CardDescription>{selectedCategoryData?.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {indexError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>This query requires a Firestore index.</span>
                    <a
                      href={indexError}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-white hover:underline"
                    >
                      Create Index <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </AlertDescription>
                </Alert>
              )}

              {loadingQuestions ? (
                <div className="flex h-40 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : questions.length === 0 ? (
                <div className="flex h-40 items-center justify-center">
                  <p className="text-muted-foreground">No questions found in this category</p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {questions.map((question) => (
                    <li key={question.id}>
                      <Card>
                        <CardHeader className="p-4">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{question.title}</CardTitle>
                            <span className="text-sm text-muted-foreground">{formatDate(question.createdAt)}</span>
                          </div>
                        </CardHeader>
                        <CardFooter className="p-4 pt-0">
                          <Link href={`/questions/${question.id}`}>
                            <Button variant="outline" size="sm">
                              View Answer
                            </Button>
                          </Link>
                        </CardFooter>
                      </Card>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
            <CardFooter>
              <div className="flex w-full items-center justify-between">
                <p className="text-sm text-muted-foreground">Showing {questions.length} questions in this category</p>
                <Link href="/dashboard/ask">
                  <Button>Ask a Question</Button>
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

