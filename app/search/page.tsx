"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SearchIcon, Loader2, AlertCircle, ExternalLink } from "lucide-react"
import { collection, query, where, getDocs, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"

const categories = [
  { value: "all", label: "All Categories" },
  { value: "prayers", label: "Prayers (Salah)" },
  { value: "fasting", label: "Fasting (Sawm)" },
  { value: "zakat", label: "Charity (Zakat)" },
  { value: "hajj", label: "Pilgrimage (Hajj)" },
  { value: "business", label: "Business & Finance" },
  { value: "family", label: "Family & Relationships" },
  { value: "general", label: "General Questions" },
]

interface Question {
  id: string
  title: string
  category: string
  question: string
  answer?: string
  createdAt: Date
}

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)
  const [indexError, setIndexError] = useState<string | null>(null)

  // Load recent answered questions on initial page load
  useEffect(() => {
    const loadRecentQuestions = async () => {
      setLoading(true)
      setIndexError(null)

      try {
        // Use a simpler query that doesn't require a composite index
        const q = query(collection(db, "questions"), where("status", "==", "answered"), limit(10))

        const querySnapshot = await getDocs(q)
        const fetchedQuestions: Question[] = []

        querySnapshot.forEach((doc) => {
          const data = doc.data()
          fetchedQuestions.push({
            id: doc.id,
            title: data.title,
            category: data.category,
            question: data.question,
            answer: data.answer,
            createdAt: data.createdAt?.toDate() || new Date(),
          })
        })

        // Sort the results client-side instead of in the query
        fetchedQuestions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

        setQuestions(fetchedQuestions)
      } catch (error: any) {
        console.error("Error fetching recent questions:", error)

        // Check if it's an index error and extract the URL
        if (error.message && error.message.includes("index")) {
          const urlMatch = error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]+/)
          if (urlMatch) {
            setIndexError(urlMatch[0])
          } else {
            setIndexError("An index is required for this query. Please contact the administrator.")
          }
        }
      } finally {
        setLoading(false)
        setInitialLoad(false)
      }
    }

    loadRecentQuestions()
  }, [])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setIndexError(null)

    try {
      let q

      if (selectedCategory === "all") {
        // Search across all categories
        q = query(collection(db, "questions"), where("status", "==", "answered"), limit(20))
      } else {
        // Search within specific category
        q = query(
          collection(db, "questions"),
          where("status", "==", "answered"),
          where("category", "==", selectedCategory),
          limit(20),
        )
      }

      const querySnapshot = await getDocs(q)
      let fetchedQuestions: Question[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        fetchedQuestions.push({
          id: doc.id,
          title: data.title,
          category: data.category,
          question: data.question,
          answer: data.answer,
          createdAt: data.createdAt?.toDate() || new Date(),
        })
      })

      // Sort the results client-side
      fetchedQuestions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

      // Filter by search term if provided
      if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase()
        fetchedQuestions = fetchedQuestions.filter(
          (q) =>
            q.title.toLowerCase().includes(lowerSearchTerm) ||
            q.question.toLowerCase().includes(lowerSearchTerm) ||
            (q.answer && q.answer.toLowerCase().includes(lowerSearchTerm)),
        )
      }

      setQuestions(fetchedQuestions)
    } catch (error: any) {
      console.error("Error searching questions:", error)

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
      setLoading(false)
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date)
  }

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-3xl font-bold">Search Islamic Questions</h1>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex flex-col gap-4 md:flex-row">
              <div className="flex-1">
                <Input
                  placeholder="Search for questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="w-full md:w-48">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SearchIcon className="mr-2 h-4 w-4" />}
                Search
              </Button>
            </form>
          </CardContent>
        </Card>

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

        <div className="mb-4">
          <h2 className="text-xl font-semibold">
            {initialLoad ? "Recent Answered Questions" : questions.length > 0 ? "Search Results" : "No Results Found"}
          </h2>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {questions.length === 0 && !initialLoad ? (
              <Card>
                <CardContent className="flex h-40 items-center justify-center">
                  <p className="text-muted-foreground">No questions found matching your search criteria</p>
                </CardContent>
              </Card>
            ) : (
              questions.map((question) => (
                <Card key={question.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-xl">{question.title}</CardTitle>
                      <Badge>{question.category.charAt(0).toUpperCase() + question.category.slice(1)}</Badge>
                    </div>
                    <CardDescription>{formatDate(question.createdAt)}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-2 text-muted-foreground">{question.question}</p>
                  </CardContent>
                  <CardFooter>
                    <Link href={`/questions/${question.id}`}>
                      <Button>View Full Answer</Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

