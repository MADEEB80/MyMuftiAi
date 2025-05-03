"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, CheckCircle, XCircle, Clock, Filter } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, updateDoc, getDoc, Timestamp, limit } from "firebase/firestore"
import { createNotification } from "@/lib/notification-service"

interface Question {
  id: string
  title: string
  question: string
  userId: string
  userName: string
  status: string
  category: string
  categoryName?: string
  createdAt: Date
  assignedTo?: string
  scholarName?: string
  answeredAt?: Date
  language: string
}

interface Scholar {
  id: string
  displayName: string
  email: string
}

interface Category {
  id: string
  name: string
  nameUrdu?: string
}

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [languageFilter, setLanguageFilter] = useState("all")
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [scholars, setScholars] = useState<Scholar[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedScholar, setSelectedScholar] = useState<string>("")
  const [isActionLoading, setIsActionLoading] = useState(false)

  const { user, userRole } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && userRole === "admin") {
      fetchQuestions()
      fetchScholars()
      fetchCategories()
    } else if (!loading) {
      router.push("/")
    }
  }, [user, userRole, loading, router])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, statusFilter, categoryFilter, languageFilter, questions])

  const fetchQuestions = async () => {
    try {
      // Use a simpler query that doesn't require a composite index
      const q = query(collection(db, "questions"), limit(100))
      const querySnapshot = await getDocs(q)
      const fetchedQuestions: Question[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        fetchedQuestions.push({
          id: doc.id,
          title: data.title || "Untitled",
          question: data.question || "",
          userId: data.userId || "",
          userName: data.userName || "Anonymous",
          status: data.status || "pending",
          category: data.category || "general",
          categoryName: data.categoryName || "General",
          createdAt: data.createdAt?.toDate() || new Date(),
          assignedTo: data.assignedTo || undefined,
          scholarName: data.scholarName || undefined,
          answeredAt: data.answeredAt?.toDate(),
          language: data.language || "en",
        })
      })

      setQuestions(fetchedQuestions)
      setFilteredQuestions(fetchedQuestions)
    } catch (error) {
      console.error("Error fetching questions:", error)
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

  const fetchCategories = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "categories"))
      const fetchedCategories: Category[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        fetchedCategories.push({
          id: doc.id,
          name: data.name || "Unknown Category",
          nameUrdu: data.nameUrdu,
        })
      })

      setCategories(fetchedCategories)
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const applyFilters = () => {
    let filtered = [...questions]

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (q) =>
          q.title.toLowerCase().includes(term) ||
          q.question.toLowerCase().includes(term) ||
          q.userName.toLowerCase().includes(term),
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((q) => q.status === statusFilter)
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((q) => q.category === categoryFilter)
    }

    // Apply language filter
    if (languageFilter !== "all") {
      filtered = filtered.filter((q) => q.language === languageFilter)
    }

    setFilteredQuestions(filtered)
  }

  const handleApproveQuestion = async (questionId: string) => {
    setIsActionLoading(true)
    try {
      await updateDoc(doc(db, "questions", questionId), {
        status: "approved",
        updatedAt: Timestamp.now(),
      })

      // Update local state
      setQuestions((prevQuestions) =>
        prevQuestions.map((q) => (q.id === questionId ? { ...q, status: "approved" } : q)),
      )

      // Notify the user
      const question = questions.find((q) => q.id === questionId)
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
      setQuestions((prevQuestions) =>
        prevQuestions.map((q) => (q.id === questionId ? { ...q, status: "rejected" } : q)),
      )

      // Notify the user
      const question = questions.find((q) => q.id === questionId)
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
      setQuestions((prevQuestions) =>
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Questions</h1>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="search" className="text-sm font-medium mb-1 block">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search questions..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="status" className="text-sm font-medium mb-1 block">
                Status
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="answered">Answered</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="category" className="text-sm font-medium mb-1 block">
                Category
              </label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="language" className="text-sm font-medium mb-1 block">
                Language
              </label>
              <Select value={languageFilter} onValueChange={setLanguageFilter}>
                <SelectTrigger id="language">
                  <SelectValue placeholder="Filter by language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ur">Urdu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Questions</CardTitle>
          <CardDescription>
            Showing {filteredQuestions.length} of {questions.length} questions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredQuestions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No questions match your filters.</p>
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
                    <TableHead>Language</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuestions.map((question) => (
                    <TableRow key={question.id}>
                      <TableCell className="font-medium">{question.title}</TableCell>
                      <TableCell>{getStatusBadge(question.status)}</TableCell>
                      <TableCell>{question.userName}</TableCell>
                      <TableCell>{formatDate(question.createdAt)}</TableCell>
                      <TableCell>{question.language === "en" ? "English" : "Urdu"}</TableCell>
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
                          <Button variant="outline" size="sm" onClick={() => router.push(`/questions/${question.id}`)}>
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
      </Card>

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
