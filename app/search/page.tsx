"use client"

import type React from "react"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useLanguage } from "@/lib/language-context"
import { useTranslation } from "@/lib/translation-context"
import { useSearchParams } from "next/navigation"
import { searchQuestions } from "@/lib/question-service"
import type { Question } from "@/types/question"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Filter, SortAsc, SortDesc, Calendar } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

// Note: This component must be used within LanguageProvider and TranslationProvider
// to access translations from en.json and ur.json
export default function SearchPage() {
  const { language, isRTL } = useLanguage()
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || ""

  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [results, setResults] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)
  const [sortBy, setSortBy] = useState<"relevance" | "date">("relevance")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Fetch search results when query changes
  const performSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const searchResults = await searchQuestions(searchQuery, language)
      setResults(searchResults)
    } catch (error) {
      console.error("Error searching questions:", error)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, language])

  // Initial search on mount if query exists
  useEffect(() => {
    if (initialQuery) {
      performSearch()
    }
  }, [initialQuery, performSearch])

  // Handle search form submission
  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      performSearch()
    },
    [performSearch],
  )

  // Extract unique categories from results
  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>()
    results.forEach((question) => {
      if (question.categoryName) {
        uniqueCategories.add(question.categoryName)
      }
    })
    return Array.from(uniqueCategories)
  }, [results])

  // Filter and sort results
  const filteredAndSortedResults = useMemo(() => {
    let filtered = [...results]

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter((q) => q.categoryName === selectedCategory)
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      if (sortBy === "date") {
        const dateA = new Date(a.createdAt).getTime()
        const dateB = new Date(b.createdAt).getTime()
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA
      } else {
        // Sort by relevance (title match)
        const titleMatchA = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ? 1 : 0
        const titleMatchB = b.title.toLowerCase().includes(searchQuery.toLowerCase()) ? 1 : 0

        if (titleMatchA !== titleMatchB) {
          return sortOrder === "asc" ? titleMatchA - titleMatchB : titleMatchB - titleMatchA
        }

        // If title match is the same, sort by date
        const dateA = new Date(a.createdAt).getTime()
        const dateB = new Date(b.createdAt).getTime()
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA
      }
    })
  }, [results, selectedCategory, sortBy, sortOrder, searchQuery])

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  }

  return (
    <div className={`container py-8`} dir={isRTL ? "rtl" : "ltr"}>
      <h1 className="text-3xl font-bold mb-6">{t("search.title")}</h1>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t("search.placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {t("search.searching")}
              </span>
            ) : (
              <span>{t("common.search")}</span>
            )}
          </Button>
        </div>
      </form>

      {/* Results Section */}
      {results.length > 0 ? (
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <p className="text-muted-foreground">
              {t("search.resultsCount", { count: filteredAndSortedResults.length })}
            </p>

            <div className="flex flex-wrap gap-2">
              {/* Sort Controls */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{t("search.sortBy")}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortBy(sortBy === "relevance" ? "date" : "relevance")}
                  className="flex items-center gap-1"
                >
                  {sortBy === "relevance" ? (
                    <>
                      <Filter className="h-4 w-4" />
                      <span>{t("search.sortRelevance")}</span>
                    </>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4" />
                      <span>{t("search.sortDate")}</span>
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="flex items-center gap-1"
                >
                  {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          {categories.length > 0 && (
            <Tabs defaultValue="all" className="mb-6">
              <TabsList className="mb-4 flex flex-wrap">
                <TabsTrigger value="all" onClick={() => setSelectedCategory(null)} className="mb-1">
                  {t("search.allCategories")}
                </TabsTrigger>
                {categories.map((category) => (
                  <TabsTrigger
                    key={category}
                    value={category}
                    onClick={() => setSelectedCategory(category)}
                    className="mb-1"
                  >
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}

          {/* Results List */}
          <motion.div className="space-y-4" variants={containerVariants} initial="hidden" animate="visible">
            {filteredAndSortedResults.map((question) => (
              <motion.div key={question.id} variants={itemVariants}>
                <Link href={`/questions/${question.id}`}>
                  <Card className="hover:bg-muted/30 transition-colors cursor-pointer">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{question.title}</CardTitle>
                      <CardDescription>
                        {t("search.by")} {question.userName} •{" "}
                        {new Date(question.createdAt).toLocaleDateString(language === "en" ? "en-US" : "ur-PK")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="line-clamp-2 text-sm text-gray-600 mb-2">{question.content}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{question.categoryName}</Badge>
                        <Badge variant={question.status === "answered" ? "default" : "secondary"}>
                          {question.status === "answered" ? t("search.statusAnswered") : t("search.statusPending")}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      ) : searchQuery && !loading ? (
        <div className="text-center py-12">
          <div className="mb-4">
            <Search className="h-12 w-12 mx-auto text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">{t("search.noResults")}</h2>
          <p className="text-muted-foreground">{t("search.noResultsDescription")}</p>
        </div>
      ) : !loading ? (
        <div className="text-center py-12">
          <div className="mb-4">
            <Search className="h-12 w-12 mx-auto text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">{t("search.title")}</h2>
          <p className="text-muted-foreground">{t("search.initialPrompt")}</p>
        </div>
      ) : null}
    </div>
  )
}