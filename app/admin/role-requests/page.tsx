"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/translation-context"
import { useLanguage } from "@/lib/language-context"
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

// Note: This component must be used within LanguageProvider and TranslationProvider
// to access translations from en.json and ur.json
export default function RoleRequestsPage() {
  const [requests, setRequests] = useState<RoleRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)

  const { user, userRole } = useAuth()
  const { t } = useTranslation()
  const { isRTL } = useLanguage()
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
          userName: data.userName || t("admin.unknown"),
          userEmail: data.userEmail || t("admin.noEmail"),
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
    return new Intl.DateTimeFormat(isRTL ? "ur-PK" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date)
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
            <CardTitle>{t("admin.accessDeniedTitle")}</CardTitle>
            <CardDescription>{t("admin.accessDeniedDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")} className="w-full">
              {t("common.back")}
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
    <div className="container py-10" dir={isRTL ? "rtl" : "ltr"}>
      <h1 className="mb-6 text-2xl font-bold">{t("admin.roleRequestsTitle")}</h1>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="pending">
            {t("admin.pending")}
            {pendingRequests.length > 0 && <Badge className="ml-2 bg-yellow-500">{pendingRequests.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="approved">{t("admin.approved")}</TabsTrigger>
          <TabsTrigger value="rejected">{t("admin.rejected")}</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="flex h-40 items-center justify-center">
                <p className="text-muted-foreground">{t("admin.noPendingRequests")}</p>
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
                          {t(`admin.${request.requestedRole}Role`)}
                        </Badge>
                        <Badge variant="outline">{formatDate(request.createdAt)}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-medium">{t("admin.qualifications")}</h3>
                      <p className="text-sm text-muted-foreground">{request.qualifications}</p>
                    </div>
                    <div>
                      <h3 className="font-medium">{t("admin.institution")}</h3>
                      <p className="text-sm text-muted-foreground">{request.institution}</p>
                    </div>
                    <div>
                      <h3 className="font-medium">{t("admin.experience")}</h3>
                      <p className="text-sm text-muted-foreground">{request.experience}</p>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleRejectRequest(request.id)}
                        disabled={isActionLoading}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        {t("admin.reject")}
                      </Button>
                      <Button onClick={() => handleApproveRequest(request)} disabled={isActionLoading}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        {t("admin.approve")}
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
                <p className="text-muted-foreground">{t("admin.noApprovedRequests")}</p>
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
                        <Badge className="bg-green-500">{t("admin.approved")}</Badge>
                        <Badge className="bg-blue-500">
                          {t(`admin.${request.requestedRole}Role`)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {t("admin.approvedOn", { date: formatDate(request.updatedAt || request.createdAt) })}
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
                <p className="text-muted-foreground">{t("admin.noRejectedRequests")}</p>
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
                        <Badge variant="destructive">{t("admin.rejected")}</Badge>
                        <Badge className="bg-blue-500">
                          {t(`admin.${request.requestedRole}Role`)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {t("admin.rejectedOn", { date: formatDate(request.updatedAt || request.createdAt) })}
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