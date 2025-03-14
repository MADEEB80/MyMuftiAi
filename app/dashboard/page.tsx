"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, Loader2, Edit, Send, UserCog, Filter, CheckSquare } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Question {
  id: string
  title: string
  category: string
  status: string
  createdAt: any
  userId: string
}

type FilterOption = "my-questions" | "all-questions"

export default function DashboardPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<FilterOption>("my-questions")
  const { user, userRole } = useAuth()

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!user) return

      try {
        let q

        // For admin users, we can fetch all questions
        if (userRole === "admin" && activeFilter === "all-questions") {
          q = query(collection(db, "questions"))
        } else {
          // For regular users or when "my-questions" filter is active
          q = query(collection(db, "questions"), where("userId", "==", user.uid))
        }

        const querySnapshot = await getDocs(q)
        const fetchedQuestions: Question[] = []

        querySnapshot.forEach((doc) => {
          const data = doc.data()
          fetchedQuestions.push({
            id: doc.id,
            title: data.title,
            category: data.category,
            status: data.status,
            createdAt: data.createdAt?.toDate() || new Date(),
            userId: data.userId,
          })
        })

        // Sort client-side
        fetchedQuestions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

        setQuestions(fetchedQuestions)

        // Apply initial filter
        if (activeFilter === "my-questions") {
          setFilteredQuestions(fetchedQuestions.filter((q) => q.userId === user.uid))
        } else {
          setFilteredQuestions(fetchedQuestions)
        }
      } catch (error) {
        console.error("Error fetching questions:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchQuestions()
  }, [user, userRole, activeFilter])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline">Draft</Badge>
      case "pending":
        return <Badge variant="secondary">Pending Review</Badge>
      case "answered":
        return (
          <Badge variant="default" className="bg-green-500">
            Answered
          </Badge>
        )
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date)
  }

  if (!user) {
    return (
      <div className="container flex h-[calc(100vh-200px)] items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please sign in to access your dashboard</CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Link href="/auth/login">
              <Button>Sign In</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          {userRole === "user" && (
            <Link href="/dashboard/request-role">
              <Button variant="outline">
                <UserCog className="mr-2 h-4 w-4" />
                Request Scholar/Admin Role
              </Button>
            </Link>
          )}
          <Link href="/dashboard/ask">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Ask a Question
            </Button>
          </Link>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <Tabs defaultValue="all" className="w-full">
          <div className="flex items-center justify-between">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Questions</TabsTrigger>
              <TabsTrigger value="draft">Drafts</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="answered">Answered</TabsTrigger>
            </TabsList>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="ml-2">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                  {activeFilter === "my-questions" && (
                    <Badge variant="secondary" className="ml-2">
                      My Questions Only
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuCheckboxItem
                  checked={activeFilter === "my-questions"}
                  onCheckedChange={() => setActiveFilter("my-questions")}
                >
                  <CheckSquare className="mr-2 h-4 w-4" />
                  My Questions Only
                </DropdownMenuCheckboxItem>
                {userRole === "admin" && (
                  <DropdownMenuCheckboxItem
                    checked={activeFilter === "all-questions"}
                    onCheckedChange={() => setActiveFilter("all-questions")}
                  >
                    <CheckSquare className="mr-2 h-4 w-4" />
                    All Questions
                  </DropdownMenuCheckboxItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <TabsContent value="all">
                <QuestionsList questions={filteredQuestions} getStatusBadge={getStatusBadge} formatDate={formatDate} />
              </TabsContent>

              <TabsContent value="draft">
                <QuestionsList
                  questions={filteredQuestions.filter((q) => q.status === "draft")}
                  getStatusBadge={getStatusBadge}
                  formatDate={formatDate}
                />
              </TabsContent>

              <TabsContent value="pending">
                <QuestionsList
                  questions={filteredQuestions.filter((q) => q.status === "pending")}
                  getStatusBadge={getStatusBadge}
                  formatDate={formatDate}
                />
              </TabsContent>

              <TabsContent value="answered">
                <QuestionsList
                  questions={filteredQuestions.filter((q) => q.status === "answered")}
                  getStatusBadge={getStatusBadge}
                  formatDate={formatDate}
                />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  )
}

interface QuestionsListProps {
  questions: Question[]
  getStatusBadge: (status: string) => React.ReactNode
  formatDate: (date: Date) => string
}

function QuestionsList({ questions, getStatusBadge, formatDate }: QuestionsListProps) {
  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="flex h-40 items-center justify-center">
          <p className="text-muted-foreground">No questions found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {questions.map((question) => (
        <Card key={question.id}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <CardTitle className="text-xl">{question.title}</CardTitle>
              {getStatusBadge(question.status)}
            </div>
            <CardDescription>
              Category: {question.category.charAt(0).toUpperCase() + question.category.slice(1)}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex items-center justify-between pt-2">
            <span className="text-sm text-muted-foreground">{formatDate(question.createdAt)}</span>
            <div className="flex gap-2">
              {question.status === "draft" && (
                <>
                  <Link href={`/dashboard/edit/${question.id}`}>
                    <Button variant="outline" size="sm">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  </Link>
                  <Link href={`/dashboard/submit/${question.id}`}>
                    <Button size="sm">
                      <Send className="mr-2 h-4 w-4" />
                      Submit
                    </Button>
                  </Link>
                </>
              )}
              {question.status === "answered" && (
                <Link href={`/questions/${question.id}`}>
                  <Button size="sm">View Answer</Button>
                </Link>
              )}
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

