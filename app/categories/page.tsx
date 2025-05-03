"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ChevronRight, AlertCircle, ExternalLink } from "lucide-react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useLanguage } from "@/lib/language-context"

interface Category {
  id: string
  name: string
  value: string
  description: string
  questionCount: number
  language?: string
}

interface Question {
  id: string
  title: string
  category: string
  createdAt: Date
  language: string
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
  const { language, isRTL } = useLanguage()

  // Translations
  const translations = {
    title: language === "ur" ? "زمرہ کے مطابق براؤز کریں" : "Browse by Category",
    categories: language === "ur" ? "زمرہ جات" : "Categories",
    questions: language === "ur" ? "سوالات" : "Questions",
    noQuestions: language === "ur" ? "اس زمرہ میں کوئی سوال نہیں ملا" : "No questions found in this category",
    showingQuestions: language === "ur" ? "اس زمرہ میں سوالات دکھا رہے ہیں" : "Showing questions in this category",
    askQuestion: language === "ur" ? "سوال پوچھیں" : "Ask a Question",
    viewAnswer: language === "ur" ? "جواب دیکھیں" : "View Answer",
    indexError:
      language === "ur"
        ? "اس کوئری کے لیے ایک فائر اسٹور انڈیکس کی ضرورت ہے۔"
        : "This query requires a Firestore index.",
    createIndex: language === "ur" ? "انڈیکس بنائیں" : "Create Index",
    error: language === "ur" ? "زمرہ جات لوڈ کرنے میں خرابی" : "Error loading categories",
  }

  // Fetch all categories
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true)
      try {
        // Simplified query - no ordering to avoid composite index requirement
        const categoriesQuery = query(collection(db, "categories"), where("language", "==", language))

        try {
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
                language: data.language || language,
              })
            })

            // Sort client-side instead of in the query
            fetchedCategories.sort((a, b) => a.name.localeCompare(b.name))

            setCategories(fetchedCategories)

            // If there's a category in the URL, select it
            if (categoryParam && fetchedCategories.some((c) => c.value === categoryParam)) {
              setSelectedCategory(categoryParam)
            } else if (fetchedCategories.length > 0) {
              // Otherwise select the first category
              setSelectedCategory(fetchedCategories[0].value)
            }
          } else {
            // Fallback: If no categories found for the current language, get all categories
            const allCategoriesQuery = query(collection(db, "categories"))
            const allCategoriesSnapshot = await getDocs(allCategoriesQuery)

            if (!allCategoriesSnapshot.empty) {
              const allCategories: Category[] = []
              allCategoriesSnapshot.forEach((doc) => {
                const data = doc.data()
                // Filter by language client-side
                if (data.language === language) {
                  allCategories.push({
                    id: doc.id,
                    name: data.name || "Unknown",
                    value: data.value || doc.id,
                    description: data.description || "",
                    questionCount: data.questionCount || 0,
                    language: data.language || language,
                  })
                }
              })

              // Sort client-side
              allCategories.sort((a, b) => a.name.localeCompare(b.name))

              setCategories(allCategories)

              if (categoryParam && allCategories.some((c) => c.value === categoryParam)) {
                setSelectedCategory(categoryParam)
              } else if (allCategories.length > 0) {
                setSelectedCategory(allCategories[0].value)
              }
            } else {
              // If still no categories, create default categories from questions
              createDefaultCategoriesFromQuestions()
            }
          }
        } catch (error: any) {
          console.error("Error with categories query:", error)

          // If there's an index error, try the fallback approach
          if (error.message && error.message.includes("index")) {
            // Fallback: Get all categories without filtering
            const simpleQuery = query(collection(db, "categories"))
            const simpleSnapshot = await getDocs(simpleQuery)

            const filteredCategories: Category[] = []
            simpleSnapshot.forEach((doc) => {
              const data = doc.data()
              // Filter by language client-side
              if (data.language === language) {
                filteredCategories.push({
                  id: doc.id,
                  name: data.name || "Unknown",
                  value: data.value || doc.id,
                  description: data.description || "",
                  questionCount: data.questionCount || 0,
                  language: data.language || language,
                })
              }
            })

            // Sort client-side
            filteredCategories.sort((a, b) => a.name.localeCompare(b.name))

            setCategories(filteredCategories)

            if (categoryParam && filteredCategories.some((c) => c.value === categoryParam)) {
              setSelectedCategory(categoryParam)
            } else if (filteredCategories.length > 0) {
              setSelectedCategory(filteredCategories[0].value)
            } else {
              // If still no categories, create default categories from questions
              createDefaultCategoriesFromQuestions()
            }
          } else {
            // For other errors, try to create default categories
            createDefaultCategoriesFromQuestions()
          }
        }
      } catch (error) {
        console.error("Error fetching categories:", error)
        // Last resort: Create empty categories array
        setCategories([])
      } finally {
        setLoading(false)
      }
    }

    // Helper function to create default categories from questions
    const createDefaultCategoriesFromQuestions = async () => {
      try {
        const questionsQuery = query(
          collection(db, "questions"),
          where("status", "==", "answered"),
          where("language", "==", language),
        )

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
              description: language === "ur" ? `سوالات متعلق ${value}` : `Questions about ${value}`,
              questionCount: count,
              language: language,
            })
          })

          // Sort client-side
          defaultCategories.sort((a, b) => a.name.localeCompare(b.name))

          setCategories(defaultCategories)

          if (categoryParam && defaultCategories.some((c) => c.value === categoryParam)) {
            setSelectedCategory(categoryParam)
          } else if (defaultCategories.length > 0) {
            setSelectedCategory(defaultCategories[0].value)
          }
        } else {
          // If no questions found, set empty categories array
          setCategories([])
        }
      } catch (error) {
        console.error("Error creating default categories:", error)
        setCategories([])
      }
    }

    fetchCategories()
  }, [categoryParam, language])

  // Fetch questions when a category is selected
  useEffect(() => {
    if (!selectedCategory) return

    const fetchQuestions = async () => {
      setLoadingQuestions(true)
      setIndexError(null)

      try {
        // Simplify the query to avoid requiring a complex composite index
        const q = query(
          collection(db, "questions"),
          where("status", "==", "answered"),
          where("category", "==", selectedCategory),
        )

        try {
          const querySnapshot = await getDocs(q)
          const fetchedQuestions: Question[] = []

          querySnapshot.forEach((doc) => {
            const data = doc.data()
            // Filter by language client-side
            if (data.language === language) {
              fetchedQuestions.push({
                id: doc.id,
                title: data.title,
                category: data.category,
                createdAt: data.createdAt?.toDate() || new Date(),
                language: data.language || language,
              })
            }
          })

          // Sort client-side
          fetchedQuestions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

          setQuestions(fetchedQuestions)
        } catch (error: any) {
          console.error("Error with complex query:", error)

          // Check if it's an index error and extract the URL
          if (error.message && error.message.includes("index")) {
            const urlMatch = error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]+/)
            if (urlMatch) {
              setIndexError(urlMatch[0])
            }

            // Fallback to simpler query
            const simpleQ = query(collection(db, "questions"), where("status", "==", "answered"))

            const simpleSnapshot = await getDocs(simpleQ)
            const filteredQuestions: Question[] = []

            simpleSnapshot.forEach((doc) => {
              const data = doc.data()
              // Filter by language and category client-side
              if (data.language === language && data.category === selectedCategory) {
                filteredQuestions.push({
                  id: doc.id,
                  title: data.title,
                  category: data.category,
                  createdAt: data.createdAt?.toDate() || new Date(),
                  language: data.language || language,
                })
              }
            })

            // Sort client-side
            filteredQuestions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            setQuestions(filteredQuestions)
          } else {
            // Set empty questions array on error
            setQuestions([])
          }
        }
      } catch (error: any) {
        console.error("Error fetching questions:", error)
        setQuestions([])
      } finally {
        setLoadingQuestions(false)
      }
    }

    fetchQuestions()

    // Update URL with the selected category
    router.push(`/categories?category=${selectedCategory}`, { scroll: false })
  }, [selectedCategory, router, language])

  const handleCategoryClick = (categoryValue: string) => {
    setSelectedCategory(categoryValue)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(language === "en" ? "en-US" : "ur-PK", {
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
    <div className={`container py-10 ${isRTL ? "rtl" : ""}`}>
      <h1 className="mb-6 text-3xl font-bold">{translations.title}</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        {/* Categories Sidebar */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>{translations.categories}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {categories.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">{translations.error}</div>
              ) : (
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
              )}
            </CardContent>
          </Card>
        </div>

        {/* Questions List */}
        <div className="md:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>{selectedCategoryData?.name || translations.questions}</CardTitle>
              <CardDescription>{selectedCategoryData?.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {indexError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>{translations.indexError}</span>
                    <a
                      href={indexError}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-white hover:underline"
                    >
                      {translations.createIndex} <ExternalLink className="ml-1 h-3 w-3" />
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
                  <p className="text-muted-foreground">{translations.noQuestions}</p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {questions.map((question) => (
                    <li key={question.id}>
                      <Card>
                        <CardHeader className="p-4">
                          <div className="flex items-center justify-between flex-wrap gap-4">
                            <CardTitle className="text-lg">{question.title}</CardTitle>
                            <span className="text-sm text-muted-foreground">{formatDate(question.createdAt)}</span>
                          </div>
                        </CardHeader>
                        <CardFooter className="p-4 pt-0">
                          <Link href={`/questions/${question.id}`}>
                            <Button variant="outline" size="sm">
                              {translations.viewAnswer}
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
                <p className="text-sm text-muted-foreground">
                  {translations.showingQuestions} ({questions.length})
                </p>
                <Link href="/dashboard/ask">
                  <Button>{translations.askQuestion}</Button>
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
