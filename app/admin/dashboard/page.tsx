"use client"

import { CardFooter } from "@/components/ui/card"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, BookOpen, HelpCircle, FileText, BarChart3, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { db } from "@/lib/firebase"
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  doc,
  updateDoc,
  getDoc,
  Timestamp,
} from "firebase/firestore"
import { createNotification } from "@/lib/notification-service"

interface DashboardStats {
  totalUsers: number
  totalQuestions: number
  pendingQuestions: number
  answeredQuestions: number
  totalCategories: number
  totalScholars: number
}

interface Question {
  id: string
  title: string
  userId: string
  userName: string
  status: string
  category: string
  createdAt: Date
  assignedTo?: string
  scholarName?: string
}

interface Scholar {
  id: string
  displayName: string
  email: string
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalQuestions: 0,
    pendingQuestions: 0,
    answeredQuestions: 0,
    totalCategories: 0,
    totalScholars: 0,
  })
  const [recentQuestions, setRecentQuestions] = useState<Question[]>([])
  const [pendingQuestions, setPendingQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [scholars, setScholars] = useState<Scholar[]>([])
  const [selectedScholar, setSelectedScholar] = useState<string>("")
  const [isActionLoading, setIsActionLoading] = useState(false)

  const { user, userRole } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && userRole === "admin") {
      fetchDashboardData()
      fetchScholars()
    } else if (!loading) {
      router.push("/")
    }
  }, [user, userRole, loading, router])

  const fetchDashboardData = async () => {
    try {
      // Fetch stats
      const usersSnapshot = await getDocs(collection(db, "users"))
      const totalUsers = usersSnapshot.size

      const scholarsQuery = query(collection(db, "users"), where("role", "==", "scholar"))
      const scholarsSnapshot = await getDocs(scholarsQuery)
      const totalScholars = scholarsSnapshot.size

      const questionsSnapshot = await getDocs(collection(db, "questions"))
      const totalQuestions = questionsSnapshot.size

      const pendingQuery = query(collection(db, "questions"), where("status", "==", "pending"))
      const pendingSnapshot = await getDocs(pendingQuery)
      const pendingQuestions = pendingSnapshot.size

      const answeredQuery = query(collection(db, "questions"), where("status", "==", "answered"))
      const answeredSnapshot = await getDocs(answeredQuery)
      const answeredQuestions = answeredSnapshot.size

      const categoriesSnapshot = await getDocs(collection(db, "categories"))
      const totalCategories = categoriesSnapshot.size

      setStats({
        totalUsers,
        totalQuestions,
        pendingQuestions,
        answeredQuestions,
        totalCategories,
        totalScholars,
      })

      // Fetch recent questions
      const recentQuery = query(collection(db, "questions"), orderBy("createdAt", "desc"), limit(5))
      const recentSnapshot = await getDocs(recentQuery)
      const recentData: Question[] = []

      recentSnapshot.forEach((doc) => {
        const data = doc.data()
        recentData.push({
          id: doc.id,
          title: data.title || "Untitled",
          userId: data.userId || "",
          userName: data.userName || "Anonymous",
          status: data.status || "pending",
          category: data.category || "general",
          createdAt: data.createdAt?.toDate() || new Date(),
          assignedTo: data.assignedTo || undefined,
          scholarName: data.scholarName || undefined,
        })
      })

      setRecentQuestions(recentData)

      // Fetch pending questions - simplified query to avoid index requirements
      const pendingQuestionsQuery = query(
        collection(db, "questions"),
        where("status", "in", ["pending", "approved"]),
        limit(10),
      )
      // Note: We're removing the orderBy to avoid requiring a composite index
      const pendingQuestionsSnapshot = await getDocs(pendingQuestionsQuery)
      const pendingData: Question[] = []

      pendingQuestionsSnapshot.forEach((doc) => {
        const data = doc.data()
        pendingData.push({
          id: doc.id,
          title: data.title || "Untitled",
          userId: data.userId || "",
          userName: data.userName || "Anonymous",
          status: data.status || "pending",
          category: data.category || "general",
          createdAt: data.createdAt?.toDate() || new Date(),
          assignedTo: data.assignedTo || undefined,
          scholarName: data.scholarName || undefined,
        })
      })

      setPendingQuestions(pendingData)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchScholars = async () => {
    try {
      const q = query(collection(db, "users"), where("role", "==", "scholar"))
      const querySnapshot = await getDocs(q)
      const fetchedScholars: Scholar[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        fetchedScholars.push({
          id: doc.id,
          displayName: data.displayName || "Unknown Scholar",
          email: data.email || "",
        })
      })

      setScholars(fetchedScholars)
    } catch (error) {
      console.error("Error fetching scholars:", error)
    }
  }

  const handleApproveQuestion = async (questionId: string) => {
    setIsActionLoading(true)
    try {
      await updateDoc(doc(db, "questions", questionId), {
        status: "approved",
        updatedAt: Timestamp.now(),
      })

      // Update local state
      setPendingQuestions((prevQuestions) =>
        prevQuestions.map((q) => (q.id === questionId ? { ...q, status: "approved" } : q)),
      )

      // Notify the user
      const question = pendingQuestions.find((q) => q.id === questionId)
      if (question) {
        await createNotification({
          userId: question.userId,
          type: "question_approved",
          title: "Your question has been approved",
          message: `Your question "${question.title}" has been approved and is awaiting a scholar's answer.`,
          relatedId: questionId,
        })
      }
    } catch (error) {
      console.error("Error approving question:", error)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleRejectQuestion = async (questionId: string) => {
    setIsActionLoading(true)
    try {
      await updateDoc(doc(db, "questions", questionId), {
        status: "rejected",
        updatedAt: Timestamp.now(),
      })

      // Update local state
      setPendingQuestions((prevQuestions) =>
        prevQuestions.map((q) => (q.id === questionId ? { ...q, status: "rejected" } : q)),
      )

      // Notify the user
      const question = pendingQuestions.find((q) => q.id === questionId)
      if (question) {
        await createNotification({
          userId: question.userId,
          type: "question_rejected",
          title: "Your question has been rejected",
          message: `Your question "${question.title}" has been rejected. Please review our guidelines for asking questions.`,
          relatedId: questionId,
        })
      }
    } catch (error) {
      console.error("Error rejecting question:", error)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleAssignQuestion = async () => {
    if (!selectedQuestion || !selectedScholar) return

    setIsActionLoading(true)
    try {
      // Get scholar name
      const scholarDoc = await getDoc(doc(db, "users", selectedScholar))
      const scholarName = scholarDoc.exists() ? scholarDoc.data().displayName || "Scholar" : "Scholar"

      await updateDoc(doc(db, "questions", selectedQuestion.id), {
        assignedTo: selectedScholar,
        scholarName: scholarName,
        updatedAt: Timestamp.now(),
      })

      // Update local state
      setPendingQuestions((prevQuestions) =>
        prevQuestions.map((q) =>
          q.id === selectedQuestion.id ? { ...q, assignedTo: selectedScholar, scholarName: scholarName } : q,
        ),
      )

      // Notify the scholar
      await createNotification({
        userId: selectedScholar,
        type: "question_assigned",
        title: "A question has been assigned to you",
        message: `You have been assigned to answer the question: "${selectedQuestion.title}"`,
        relatedId: selectedQuestion.id,
      })

      // Close dialog
      setIsAssignDialogOpen(false)
      setSelectedQuestion(null)
      setSelectedScholar("")
    } catch (error) {
      console.error("Error assigning question:", error)
    } finally {
      setIsActionLoading(false)
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
            <CheckCircle className="h-3 w-3" /> Approved
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" /> Rejected
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

  if (!user || userRole !== "admin") {
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
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Users className="mr-2 h-5 w-5 text-blue-500" />
              Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalUsers}</div>
            <p className="text-sm text-muted-foreground">
              Including {stats.totalScholars} scholar{stats.totalScholars !== 1 && "s"}
            </p>
          </CardContent>
          <CardFooter className="pt-0">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/users">Manage Users</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <HelpCircle className="mr-2 h-5 w-5 text-green-500" />
              Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalQuestions}</div>
            <p className="text-sm text-muted-foreground">
              {stats.pendingQuestions} pending, {stats.answeredQuestions} answered
            </p>
          </CardContent>
          <CardFooter className="pt-0">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/questions">Manage Questions</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <BookOpen className="mr-2 h-5 w-5 text-purple-500" />
              Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalCategories}</div>
            <p className="text-sm text-muted-foreground">Organize questions by topic</p>
          </CardContent>
          <CardFooter className="pt-0">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/categories">Manage Categories</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button asChild className="h-auto py-4 flex flex-col items-center justify-center">
            <Link href="/admin/questions">
              <FileText className="h-6 w-6 mb-2" />
              <span>Manage Questions</span>
            </Link>
          </Button>
          <Button asChild className="h-auto py-4 flex flex-col items-center justify-center">
            <Link href="/admin/users">
              <Users className="h-6 w-6 mb-2" />
              <span>Manage Users</span>
            </Link>
          </Button>
          <Button asChild className="h-auto py-4 flex flex-col items-center justify-center">
            <Link href="/admin/categories">
              <BookOpen className="h-6 w-6 mb-2" />
              <span>Manage Categories</span>
            </Link>
          </Button>
          <Button asChild className="h-auto py-4 flex flex-col items-center justify-center">
            <Link href="/admin/roadmap">
              <BarChart3 className="h-6 w-6 mb-2" />
              <span>View Roadmap</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Developer Tools */}
      {process.env.NODE_ENV !== "production" && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Developer Tools</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button asChild variant="outline" className="h-auto py-4 flex flex-col items-center justify-center">
              <Link href="/scholar/dashboard">
                <Users className="h-6 w-6 mb-2" />
                <span>Test Scholar Dashboard</span>
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Tabs for Questions */}
      <Tabs defaultValue="pending" className="mt-8">
        <TabsList className="mb-4">
          <TabsTrigger value="pending">Pending Questions</TabsTrigger>
          <TabsTrigger value="recent">Recent Questions</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Questions Awaiting Action</CardTitle>
              <CardDescription>Approve, reject, or assign questions to scholars</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingQuestions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No pending questions at the moment.</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingQuestions.map((question) => (
                        <TableRow key={question.id}>
                          <TableCell className="font-medium">{question.title}</TableCell>
                          <TableCell>{getStatusBadge(question.status)}</TableCell>
                          <TableCell>{question.userName}</TableCell>
                          <TableCell>{formatDate(question.createdAt)}</TableCell>
                          <TableCell>{question.scholarName || "Unassigned"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {question.status === "pending" && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleApproveQuestion(question.id)}
                                    disabled={isActionLoading}
                                    className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRejectQuestion(question.id)}
                                    disabled={isActionLoading}
                                    className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}
                              {question.status === "approved" && !question.assignedTo && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedQuestion(question)
                                    setIsAssignDialogOpen(true)
                                  }}
                                  disabled={isActionLoading}
                                >
                                  Assign
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/questions/${question.id}`)}
                              >
                                View
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button asChild>
                <Link href="/admin/questions">View All Questions</Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Recently Added Questions</CardTitle>
              <CardDescription>The most recent questions from users</CardDescription>
            </CardHeader>
            <CardContent>
              {recentQuestions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No questions have been added yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentQuestions.map((question) => (
                    <Card key={question.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg">{question.title}</CardTitle>
                          {getStatusBadge(question.status)}
                        </div>
                        <CardDescription>
                          From: {question.userName} on {formatDate(question.createdAt)}
                        </CardDescription>
                      </CardHeader>
                      <CardFooter className="pt-2">
                        <Button size="sm" onClick={() => router.push(`/questions/${question.id}`)}>
                          View Question
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

      {/* Assign Question Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Question to Scholar</DialogTitle>
            <DialogDescription>Select a scholar to answer the question: "{selectedQuestion?.title}"</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedScholar} onValueChange={setSelectedScholar}>
              <SelectTrigger>
                <SelectValue placeholder="Select a scholar" />
              </SelectTrigger>
              <SelectContent>
                {scholars.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No scholars available
                  </SelectItem>
                ) : (
                  scholars.map((scholar) => (
                    <SelectItem key={scholar.id} value={scholar.id}>
                      {scholar.displayName} ({scholar.email})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)} disabled={isActionLoading}>
              Cancel
            </Button>
            <Button onClick={handleAssignQuestion} disabled={isActionLoading || !selectedScholar}>
              {isActionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                "Assign Question"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
