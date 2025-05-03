"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, Clock, FileText, HelpCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs } from "firebase/firestore"

interface ScholarStats {
  assignedQuestions: number
  answeredQuestions: number
  pendingQuestions: number
}

interface Question {
  id: string
  title: string
  question: string
  userId: string
  userName: string
  status: string
  category: string
  createdAt: Date
  assignedTo?: string
  scholarName?: string
  answeredAt?: Date
  answer?: string
}

export default function ScholarDashboardPage() {
  const [stats, setStats] = useState<ScholarStats>({
    assignedQuestions: 0,
    answeredQuestions: 0,
    pendingQuestions: 0,
  })
  const [pendingQuestions, setPendingQuestions] = useState<Question[]>([])
  const [answeredQuestions, setAnsweredQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)

  const { user, userRole } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && userRole === "scholar") {
      fetchScholarData()
    } else if (!loading) {
      router.push("/")
    }
  }, [user, userRole, loading, router])

  const fetchScholarData = async () => {
    if (!user) return

    try {
      // Fetch assigned questions
      const assignedQuery = query(
        collection(db, "questions"),
        where("assignedTo", "==", user.uid),
        where("status", "==", "approved"),
      )
      const assignedSnapshot = await getDocs(assignedQuery)
      const assignedData: Question[] = []

      assignedSnapshot.forEach((doc) => {
        const data = doc.data()
        assignedData.push({
          id: doc.id,
          title: data.title || "Untitled",
          question: data.question || "",
          userId: data.userId || "",
          userName: data.userName || "Anonymous",
          status: data.status || "pending",
          category: data.category || "general",
          createdAt: data.createdAt?.toDate() || new Date(),
          assignedTo: data.assignedTo || undefined,
          scholarName: data.scholarName || undefined,
        })
      })

      setPendingQuestions(assignedData)

      // Fetch answered questions
      const answeredQuery = query(
        collection(db, "questions"),
        where("answeredBy", "==", user.uid),
        where("status", "==", "answered"),
      )
      const answeredSnapshot = await getDocs(answeredQuery)
      const answeredData: Question[] = []

      answeredSnapshot.forEach((doc) => {
        const data = doc.data()
        answeredData.push({
          id: doc.id,
          title: data.title || "Untitled",
          question: data.question || "",
          userId: data.userId || "",
          userName: data.userName || "Anonymous",
          status: data.status || "answered",
          category: data.category || "general",
          createdAt: data.createdAt?.toDate() || new Date(),
          assignedTo: data.assignedTo || undefined,
          scholarName: data.scholarName || undefined,
          answeredAt: data.answeredAt?.toDate(),
          answer: data.answer || "",
        })
      })

      setAnsweredQuestions(answeredData)

      // Set stats
      setStats({
        assignedQuestions: assignedData.length + answeredData.length,
        answeredQuestions: answeredData.length,
        pendingQuestions: assignedData.length,
      })
    } catch (error) {
      console.error("Error fetching scholar data:", error)
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> Pending
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 flex items-center gap-1">
            <Clock className="h-3 w-3" /> Assigned
          </Badge>
        )
      case "answered":
        return (
          <Badge className="bg-green-500 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Answered
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  if (loading) {
    return (
      <div className="container flex h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user || userRole !== "scholar") {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You do not have permission to access this page.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")} className="w-full">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-8">Scholar Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <FileText className="mr-2 h-5 w-5 text-blue-500" />
              Total Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.assignedQuestions}</div>
            <p className="text-sm text-muted-foreground">Questions assigned to you</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Clock className="mr-2 h-5 w-5 text-amber-500" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pendingQuestions}</div>
            <p className="text-sm text-muted-foreground">Questions awaiting your answer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
              Answered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.answeredQuestions}</div>
            <p className="text-sm text-muted-foreground">Questions you've answered</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="pending">Pending Questions</TabsTrigger>
          <TabsTrigger value="answered">Answered Questions</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Questions Awaiting Your Response</CardTitle>
              <CardDescription>Review and answer questions assigned to you</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingQuestions.length === 0 ? (
                <div className="flex h-40 items-center justify-center">
                  <p className="text-muted-foreground">No pending questions assigned to you</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingQuestions.map((question) => (
                    <Card key={question.id} className="border-2 border-blue-200">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg">{question.title}</CardTitle>
                          {getStatusBadge(question.status)}
                        </div>
                        <CardDescription>
                          From: {question.userName} on {formatDate(question.createdAt)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <p className="line-clamp-3 text-sm text-muted-foreground">{question.question}</p>
                      </CardContent>
                      <CardFooter className="flex justify-end pt-0">
                        <Button
                          size="sm"
                          onClick={() => router.push(`/scholar/answer/${question.id}`)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <HelpCircle className="mr-2 h-4 w-4" />
                          Answer This Question
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" asChild>
                <Link href="/scholar/questions">View All Assigned Questions</Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="answered">
          <Card>
            <CardHeader>
              <CardTitle>Questions You've Answered</CardTitle>
              <CardDescription>Review your previous answers</CardDescription>
            </CardHeader>
            <CardContent>
              {answeredQuestions.length === 0 ? (
                <div className="flex h-40 items-center justify-center">
                  <p className="text-muted-foreground">You haven't answered any questions yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {answeredQuestions.map((question) => (
                    <Card key={question.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg">{question.title}</CardTitle>
                          {getStatusBadge(question.status)}
                        </div>
                        <CardDescription>Answered on: {formatDate(question.answeredAt || new Date())}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-2">
                          <h4 className="text-sm font-medium">Question:</h4>
                          <p className="line-clamp-2 text-sm text-muted-foreground">{question.question}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">Your Answer:</h4>
                          <p className="line-clamp-3 text-sm text-muted-foreground">{question.answer}</p>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-end pt-0">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/questions/${question.id}`}>View Full Question</Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
