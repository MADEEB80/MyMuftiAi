"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { collection, query, getDocs, doc, updateDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { updateUserRole, type UserRole } from "@/lib/user-service"

interface RoleRequest {
  id: string
  userId: string
  userName: string
  userEmail: string
  requestedRole: UserRole
  qualifications: string
  institution: string
  experience: string
  status: "pending" | "approved" | "rejected"
  createdAt: Date
  updatedAt?: Date
}

export default function RoleRequestsPage() {
  const [requests, setRequests] = useState<RoleRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)

  const { user, userRole } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && userRole === "admin") {
      fetchRoleRequests()
    } else if (!loading) {
      router.push("/")
    }
  }, [user, userRole, loading, router])

  const fetchRoleRequests = async () => {
    try {
      // Use a query without orderBy to avoid index requirements
      const q = query(collection(db, "roleRequests"))

      const querySnapshot = await getDocs(q)
      const fetchedRequests: RoleRequest[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        fetchedRequests.push({
          id: doc.id,
          userId: data.userId,
          userName: data.userName || "Unknown",
          userEmail: data.userEmail || "No email",
          requestedRole: data.requestedRole,
          qualifications: data.qualifications,
          institution: data.institution,
          experience: data.experience,
          status: data.status,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate(),
        })
      })

      // Sort client-side instead of in the query
      fetchedRequests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

      setRequests(fetchedRequests)
    } catch (error) {
      console.error("Error fetching role requests:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveRequest = async (request: RoleRequest) => {
    setIsActionLoading(true)
    try {
      // Update the request status
      await updateDoc(doc(db, "roleRequests", request.id), {
        status: "approved",
        updatedAt: serverTimestamp(),
      })

      // Update the user's role
      await updateUserRole(request.userId, request.requestedRole)

      // Update local state
      setRequests((prevRequests) => prevRequests.map((r) => (r.id === request.id ? { ...r, status: "approved" } : r)))
    } catch (error) {
      console.error("Error approving request:", error)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    setIsActionLoading(true)
    try {
      await updateDoc(doc(db, "roleRequests", requestId), {
        status: "rejected",
        updatedAt: serverTimestamp(),
      })

      // Update local state
      setRequests((prevRequests) => prevRequests.map((r) => (r.id === requestId ? { ...r, status: "rejected" } : r)))
    } catch (error) {
      console.error("Error rejecting request:", error)
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

  const pendingRequests = requests.filter((r) => r.status === "pending")
  const approvedRequests = requests.filter((r) => r.status === "approved")
  const rejectedRequests = requests.filter((r) => r.status === "rejected")

  return (
    <div className="container py-10">
      <h1 className="mb-6 text-2xl font-bold">Role Requests</h1>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="pending">
            Pending
            {pendingRequests.length > 0 && <Badge className="ml-2 bg-yellow-500">{pendingRequests.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="flex h-40 items-center justify-center">
                <p className="text-muted-foreground">No pending role requests</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{request.userName}</CardTitle>
                        <CardDescription>{request.userEmail}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-500">
                          {request.requestedRole.charAt(0).toUpperCase() + request.requestedRole.slice(1)} Role
                        </Badge>
                        <Badge variant="outline">{formatDate(request.createdAt)}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-medium">Qualifications:</h3>
                      <p className="text-sm text-muted-foreground">{request.qualifications}</p>
                    </div>
                    <div>
                      <h3 className="font-medium">Institution:</h3>
                      <p className="text-sm text-muted-foreground">{request.institution}</p>
                    </div>
                    <div>
                      <h3 className="font-medium">Experience:</h3>
                      <p className="text-sm text-muted-foreground">{request.experience}</p>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleRejectRequest(request.id)}
                        disabled={isActionLoading}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                      <Button onClick={() => handleApproveRequest(request)} disabled={isActionLoading}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved">
          {approvedRequests.length === 0 ? (
            <Card>
              <CardContent className="flex h-40 items-center justify-center">
                <p className="text-muted-foreground">No approved role requests</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {approvedRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{request.userName}</CardTitle>
                        <CardDescription>{request.userEmail}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-500">Approved</Badge>
                        <Badge className="bg-blue-500">
                          {request.requestedRole.charAt(0).toUpperCase() + request.requestedRole.slice(1)} Role
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Approved on {formatDate(request.updatedAt || request.createdAt)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected">
          {rejectedRequests.length === 0 ? (
            <Card>
              <CardContent className="flex h-40 items-center justify-center">
                <p className="text-muted-foreground">No rejected role requests</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {rejectedRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{request.userName}</CardTitle>
                        <CardDescription>{request.userEmail}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive">Rejected</Badge>
                        <Badge className="bg-blue-500">
                          {request.requestedRole.charAt(0).toUpperCase() + request.requestedRole.slice(1)} Role
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Rejected on {formatDate(request.updatedAt || request.createdAt)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
