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
import { useLanguage } from "@/lib/language-context"
import { useTranslation } from "@/lib/translation-context"
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

// Note: This component must be used within LanguageProvider and TranslationProvider
// to access translations from en.json and ur.json
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
  const { language, isRTL } = useLanguage()
  const { t } = useTranslation()
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
          title: data.title || t("questionDetail.untitled"),
          userId: data.userId || "",
          userName: data.userName || t("common.anonymous"),
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
      const pendingQuestionsSnapshot = await getDocs(pendingQuestionsQuery)
      const pendingData: Question[] = []

      pendingQuestionsSnapshot.forEach((doc) => {
        const data = doc.data()
        pendingData.push({
          id: doc.id,
          title: data.title || t("questionDetail.untitled"),
          userId: data.userId || "",
          userName: data.userName || t("common.anonymous"),
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
          displayName: data.displayName || t("dashboard.unknownScholar"),
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
          title: t("dashboard.notificationQuestionApproved"),
          message: t("dashboard.notificationQuestionApprovedMessage", { title: question.title }),
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
          title: t("dashboard.notificationQuestionRejected"),
          message: t("dashboard.notificationQuestionRejectedMessage", { title: question.title }),
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
      const scholarName = scholarDoc.exists() ? scholarDoc.data().displayName || t("dashboard.unknownScholar") : t("dashboard.unknownScholar")

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
        title: t("dashboard.notificationQuestionAssigned"),
        message: t("dashboard.notificationQuestionAssignedMessage", { title: selectedQuestion.title }),
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
    return new Intl.DateTimeFormat(language === "en" ? "en-US" : "ur-PK", {
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
            <Clock className="h-3 w-3" /> {t("dashboard.statusPending")}
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> {t("dashboard.statusApproved")}
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" /> {t("dashboard.statusRejected")}
          </Badge>
        )
      case "answered":
        return (
          <Badge className="bg-green-500 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> {t("questionDetail.statusAnswered")}
          </Badge>
        )
      default:
        return <Badge variant="outline">{t("dashboard.statusUnknown")}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="container flex h-[calc(100vh-200px)] items-center justify-center" dir={isRTL ? "rtl" : "ltr"}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user || userRole !== "admin") {
    return (
      <div className="container py-10" dir={isRTL ? "rtl" : "ltr"}>
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.accessDenied")}</CardTitle>
            <CardDescription>{t("dashboard.accessDeniedDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")} className="w-full">
              {t("questionDetail.returnToHome")}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-10" dir={isRTL ? "rtl" : "ltr"}>
      <h1 className="text-3xl font-bold mb-8">{t("dashboard.title")}</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Users className="mr-2 h-5 w-5 text-blue-500" />
              {t("dashboard.users")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalUsers}</div>
            <p className="text-sm text-muted-foreground">
              {t("dashboard.usersDescription", { count: stats.totalScholars })}
            </p>
          </CardContent>
          <CardFooter className="pt-0">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/users">{t("dashboard.manageUsers")}</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <HelpCircle className="mr-2 h-5 w-5 text-green-500" />
              {t("common.questions")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalQuestions}</div>
            <p className="text-sm text-muted-foreground">
              {t("dashboard.questionsDescription", { pending: stats.pendingQuestions, answered: stats.answeredQuestions })}
            </p>
          </CardContent>
          <CardFooter className="pt-0">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/questions">{t("dashboard.manageQuestions")}</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <BookOpen className="mr-2 h-5 w-5 text-purple-500" />
              {t("common.categories")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalCategories}</div>
            <p className="text-sm text-muted-foreground">{t("dashboard.categoriesDescription")}</p>
          </CardContent>
          <CardFooter className="pt-0">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/categories">{t("dashboard.manageCategories")}</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">{t("dashboard.quickActions")}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button asChild className="h-auto py-4 flex flex-col items-center justify-center">
            <Link href="/admin/questions">
              <FileText className="h-6 w-6 mb-2" />
              <span>{t("dashboard.manageQuestions")}</span>
            </Link>
          </Button>
          <Button asChild className="h-auto py-4 flex flex-col items-center justify-center">
            <Link href="/admin/users">
              <Users className="h-6 w-6 mb-2" />
              <span>{t("dashboard.manageUsers")}</span>
            </Link>
          </Button>
          <Button asChild className="h-auto py-4 flex flex-col items-center justify-center">
            <Link href="/admin/categories">
              <BookOpen className="h-6 w-6 mb-2" />
              <span>{t("dashboard.manageCategories")}</span>
            </Link>
          </Button>
          <Button asChild className="h-auto py-4 flex flex-col items-center justify-center">
            <Link href="/admin/roadmap">
              <BarChart3 className="h-6 w-6 mb-2" />
              <span>{t("dashboard.viewRoadmap")}</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Developer Tools */}
      {process.env.NODE_ENV !== "production" && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">{t("dashboard.developerTools")}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button asChild variant="outline" className="h-auto py-4 flex flex-col items-center justify-center">
              <Link href="/scholar/dashboard">
                <Users className="h-6 w-6 mb-2" />
                <span>{t("dashboard.testScholarDashboard")}</span>
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Tabs for Questions */}
      <Tabs defaultValue="pending" className="mt-8">
        <TabsList className="mb-4">
          <TabsTrigger value="pending">{t("dashboard.pendingQuestions")}</TabsTrigger>
          <TabsTrigger value="recent">{t("dashboard.recentQuestions")}</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>{t("dashboard.pendingQuestionsTitle")}</CardTitle>
              <CardDescription>{t("dashboard.pendingQuestionsDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingQuestions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">{t("dashboard.noPendingQuestions")}</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("dashboard.tableTitle")}</TableHead>
                        <TableHead>{t("dashboard.tableStatus")}</TableHead>
                        <TableHead>{t("dashboard.tableUser")}</TableHead>
                        <TableHead>{t("dashboard.tableDate")}</TableHead>
                        <TableHead>{t("dashboard.tableAssignedTo")}</TableHead>
                        <TableHead className="text-right">{t("dashboard.tableActions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingQuestions.map((question) => (
                        <TableRow key={question.id}>
                          <TableCell className="font-medium">{question.title}</TableCell>
                          <TableCell>{getStatusBadge(question.status)}</TableCell>
                          <TableCell>{question.userName}</TableCell>
                          <TableCell>{formatDate(question.createdAt)}</TableCell>
                          <TableCell>{question.scholarName || t("dashboard.unassigned")}</TableCell>
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
                                    {t("dashboard.approve")}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRejectQuestion(question.id)}
                                    disabled={isActionLoading}
                                    className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                                  >
                                    {t("dashboard.reject")}
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
                                  {t("dashboard.assign")}
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/questions/${question.id}`)}
                              >
                                {t("dashboard.view")}
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
                <Link href="/admin/questions">{t("dashboard.viewAllQuestions")}</Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>{t("dashboard.recentQuestionsTitle")}</CardTitle>
              <CardDescription>{t("dashboard.recentQuestionsDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              {recentQuestions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">{t("dashboard.noRecentQuestions")}</p>
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
                          {t("dashboard.from")} {question.userName} {t("dashboard.on")} {formatDate(question.createdAt)}
                        </CardDescription>
                      </CardHeader>
                      <CardFooter className="pt-2">
                        <Button size="sm" onClick={() => router.push(`/questions/${question.id}`)}>
                          {t("dashboard.viewQuestion")}
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
            <DialogTitle>{t("dashboard.assignQuestionTitle")}</DialogTitle>
            <DialogDescription>
              {t("dashboard.assignQuestionDescription", { title: selectedQuestion?.title })}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedScholar} onValueChange={setSelectedScholar}>
              <SelectTrigger>
                <SelectValue placeholder={t("dashboard.selectScholarPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {scholars.length === 0 ? (
                  <SelectItem value="none" disabled>
                    {t("dashboard.noScholarsAvailable")}
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
              {t("common.cancel")}
            </Button>
            <Button onClick={handleAssignQuestion} disabled={isActionLoading || !selectedScholar}>
              {isActionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("dashboard.assigning")}
                </>
              ) : (
                t("dashboard.assignQuestion")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}