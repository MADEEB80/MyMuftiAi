"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, XCircle, User, MessageSquare, UserCog } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { collection, query, where, getDocs, orderBy, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function AdminPage() {
  const [pendingQuestions, setPendingQuestions] = useState<any[]>([])
  const [pendingRoleRequests, setPendingRoleRequests] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalQuestions: 0,
    answeredQuestions: 0,
    pendingQuestions: 0,
    pendingRoleRequests: 0,
  })

  const { user, userRole } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && userRole === "admin") {
      fetchData()
    } else if (!loading) {
      router.push("/")
    }
  }, [user, userRole, loading, router])

  const fetchData = async () => {
    try {
      // Fetch pending questions
      const questionsQuery = query(collection(db, "questions"), where("status", "==", "pending"))

      const questionsSnapshot = await getDocs(questionsQuery)
      const pendingQuestionsData: any[] = []

      questionsSnapshot.forEach((doc) => {
        pendingQuestionsData.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })
      })

      // Sort client-side
      pendingQuestionsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

      setPendingQuestions(pendingQuestionsData)

      // Fetch pending role requests
      const roleRequestsQuery = query(collection(db, "roleRequests"), where("status", "==", "pending"))

      const roleRequestsSnapshot = await getDocs(roleRequestsQuery)
      const pendingRoleRequestsData: any[] = []

      roleRequestsSnapshot.forEach((doc) => {
        pendingRoleRequestsData.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })
      })

      // Sort client-side
      pendingRoleRequestsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

      setPendingRoleRequests(pendingRoleRequestsData)

      // Fetch users (in a real app, you'd implement pagination)
      const usersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"))

      const usersSnapshot = await getDocs(usersQuery)
      const usersData: any[] = []

      usersSnapshot.forEach((doc) => {
        usersData.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })
      })

      setUsers(usersData)

      // Calculate stats
      const statsQuery = query(collection(db, "questions"))
      const statsSnapshot = await getDocs(statsQuery)

      let totalQuestions = 0
      let answeredQuestions = 0
      let pendingQuestionsCount = 0

      statsSnapshot.forEach((doc) => {
        totalQuestions++
        if (doc.data().status === "answered") answeredQuestions++
        if (doc.data().status === "pending") pendingQuestionsCount++
      })

      setStats({
        totalUsers: usersData.length,
        totalQuestions,
        answeredQuestions,
        pendingQuestions: pendingQuestionsCount,
        pendingRoleRequests: pendingRoleRequestsData.length,
      })
    } catch (error) {
      console.error("Error fetching admin data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveQuestion = async (questionId: string) => {
    try {
      await updateDoc(doc(db, "questions", questionId), {
        status: "approved",
        updatedAt: new Date(),
      })

      // Update local state
      setPendingQuestions((prev) => prev.filter((question) => question.id !== questionId))

      // Refresh stats
      setStats((prev) => ({
        ...prev,
        pendingQuestions: prev.pendingQuestions - 1,
      }))
    } catch (error) {
      console.error("Error approving question:", error)
    }
  }

  const handleRejectQuestion = async (questionId: string) => {
    try {
      await updateDoc(doc(db, "questions", questionId), {
        status: "rejected",
        updatedAt: new Date(),
      })

      // Update local state
      setPendingQuestions((prev) => prev.filter((question) => question.id !== questionId))

      // Refresh stats
      setStats((prev) => ({
        ...prev,
        pendingQuestions: prev.pendingQuestions - 1,
      }))
    } catch (error) {
      console.error("Error rejecting question:", error)
    }
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

  if (!user || userRole !== "admin") {
    return (
      <div className="container py-10">
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You do not have permission to access the admin panel.</CardDescription>
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
      <h1 className="mb-8 text-3xl font-bold">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
          <CardFooter>
            <Link href="/admin/users" className="w-full">
              <Button variant="outline" className="w-full">
                Manage Users
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQuestions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Answered</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.answeredQuestions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Questions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingQuestions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Role Requests</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingRoleRequests}</div>
            <p className="text-xs text-muted-foreground">Pending approval</p>
          </CardContent>
          <CardFooter>
            <Link href="/admin/role-requests" className="w-full">
              <Button variant="outline" className="w-full">
                View Requests
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      <Tabs defaultValue="questions" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="questions">Pending Questions</TabsTrigger>
          <TabsTrigger value="users">Recent Users</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="questions">
          <Card>
            <CardHeader>
              <CardTitle>Questions Awaiting Approval</CardTitle>
              <CardDescription>Review and approve questions before they are assigned to scholars</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingQuestions.length === 0 ? (
                <div className="flex h-40 items-center justify-center">
                  <p className="text-muted-foreground">No pending questions</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingQuestions.map((question) => (
                    <Card key={question.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg">{question.title}</CardTitle>
                          <Badge>{question.category.charAt(0).toUpperCase() + question.category.slice(1)}</Badge>
                        </div>
                        <CardDescription>
                          From: {question.userName} ({question.userEmail}) on {formatDate(question.createdAt)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <p className="line-clamp-3 text-sm text-muted-foreground">{question.question}</p>
                      </CardContent>
                      <CardContent className="flex justify-end gap-2 pt-0">
                        <Button variant="outline" size="sm" onClick={() => handleRejectQuestion(question.id)}>
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                        <Button size="sm" onClick={() => handleApproveQuestion(question.id)}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Recent Users</CardTitle>
              <CardDescription>Recently registered users</CardDescription>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <div className="flex h-40 items-center justify-center">
                  <p className="text-muted-foreground">No users found</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-2 text-left font-medium">Name</th>
                        <th className="p-2 text-left font-medium">Email</th>
                        <th className="p-2 text-left font-medium">Joined</th>
                        <th className="p-2 text-left font-medium">Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.slice(0, 5).map((user) => (
                        <tr key={user.id} className="border-b">
                          <td className="p-2">{user.displayName || "N/A"}</td>
                          <td className="p-2">{user.email}</td>
                          <td className="p-2">{formatDate(user.createdAt)}</td>
                          <td className="p-2">
                            <Badge variant="outline">{user.role || "User"}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Link href="/admin/users" className="w-full">
                <Button variant="outline" className="w-full">
                  View All Users
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Platform Settings</CardTitle>
              <CardDescription>Manage platform configuration and settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Categories</h3>
                  <p className="text-sm text-muted-foreground">Manage question categories</p>
                  <Link href="/admin/categories" className="mt-2 inline-block">
                    <Button>Manage Categories</Button>
                  </Link>
                </div>

                <div>
                  <h3 className="text-lg font-medium">User Roles</h3>
                  <p className="text-sm text-muted-foreground">Manage user roles and permissions</p>
                  <Link href="/admin/role-requests" className="mt-2 inline-block">
                    <Button>Manage Role Requests</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

