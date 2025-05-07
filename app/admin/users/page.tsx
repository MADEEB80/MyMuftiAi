"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Search, UserX, UserCog, UserCheck, Trash2, AlertTriangle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/translation-context"
import { useLanguage } from "@/lib/language-context"
import { collection, query, orderBy, getDocs, doc, deleteDoc, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { updateUserRole, updateUserStatus, type UserRole, type UserStatus } from "@/lib/user-service"

interface User {
  id: string
  displayName: string
  email: string
  status: UserStatus
  role: UserRole
  createdAt: Date
  updatedAt?: Date
}

// Note: This component must be used within LanguageProvider and TranslationProvider
// to access translations from en.json and ur.json
export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<UserRole>("user")

  const { user, userRole } = useAuth()
  const { t } = useTranslation()
  const { isRTL } = useLanguage()
  const router = useRouter()

  useEffect(() => {
    if (user && userRole === "admin") {
      fetchUsers()
    } else if (!loading) {
      router.push("/")
    }
  }, [user, userRole, loading, router])

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUsers(users)
    } else {
      const lowercasedSearch = searchTerm.toLowerCase()
      setFilteredUsers(
        users.filter(
          (user) =>
            user.displayName.toLowerCase().includes(lowercasedSearch) ||
            user.email.toLowerCase().includes(lowercasedSearch) ||
            user.role.toLowerCase().includes(lowercasedSearch),
        ),
      )
    }
  }, [searchTerm, users])

  const fetchUsers = async () => {
    try {
      const q = query(collection(db, "users"), orderBy("createdAt", "desc"))

      const querySnapshot = await getDocs(q)
      const fetchedUsers: User[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        fetchedUsers.push({
          id: doc.id,
          displayName: data.displayName || t("admin.unknown"),
          email: data.email || t("admin.noEmail"),
          status: data.status || "active",
          role: data.role || "user",
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate(),
        })
      })

      setUsers(fetchedUsers)
      setFilteredUsers(fetchedUsers)
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleBlockUser = async (userId: string) => {
    setIsActionLoading(true)
    try {
      await updateUserStatus(userId, "blocked")

      // Update local state
      setUsers((prevUsers) => prevUsers.map((user) => (user.id === userId ? { ...user, status: "blocked" } : user)))
    } catch (error) {
      console.error("Error blocking user:", error)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleUnblockUser = async (userId: string) => {
    setIsActionLoading(true)
    try {
      await updateUserStatus(userId, "active")

      // Update local state
      setUsers((prevUsers) => prevUsers.map((user) => (user.id === userId ? { ...user, status: "active" } : user)))
    } catch (error) {
      console.error("Error unblocking user:", error)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    setIsActionLoading(true)
    try {
      // Delete user document
      await deleteDoc(doc(db, "users", selectedUser.id))

      // Delete user's questions
      const questionsQuery = query(collection(db, "questions"), where("userId", "==", selectedUser.id))

      const questionsSnapshot = await getDocs(questionsQuery)
      const deletePromises = questionsSnapshot.docs.map((doc) => deleteDoc(doc.ref))
      await Promise.all(deletePromises)

      // Update local state
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== selectedUser.id))

      // Close dialog
      setIsDeleteDialogOpen(false)
      setSelectedUser(null)
    } catch (error) {
      console.error("Error deleting user:", error)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleChangeRole = async () => {
    if (!selectedUser || !selectedRole) return

    setIsActionLoading(true)
    try {
      await updateUserRole(selectedUser.id, selectedRole)

      // Update local state
      setUsers((prevUsers) =>
        prevUsers.map((user) => (user.id === selectedUser.id ? { ...user, role: selectedRole } : user)),
      )

      // Close dialog
      setIsRoleDialogOpen(false)
      setSelectedUser(null)
    } catch (error) {
      console.error("Error changing user role:", error)
    } finally {
      setIsActionLoading(false)
    }
  }

  const openRoleDialog = (user: User) => {
    setSelectedUser(user)
    setSelectedRole(user.role)
    setIsRoleDialogOpen(true)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(isRTL ? "ar" : "en-US", {
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

  return (
    <div className="container py-10" dir={isRTL ? "rtl" : "ltr"}>
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.usersManagementTitle")}</CardTitle>
          <CardDescription>{t("admin.usersManagementDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("admin.searchUsersPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.name")}</TableHead>
                    <TableHead>{t("admin.email")}</TableHead>
                    <TableHead>{t("admin.role")}</TableHead>
                    <TableHead>{t("admin.status")}</TableHead>
                    <TableHead>{t("admin.joined")}</TableHead>
                    <TableHead className="text-right">{t("admin.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        {t("admin.noUsersFound")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.displayName}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              user.role === "admin"
                                ? "bg-blue-100 text-blue-800 border-blue-300"
                                : user.role === "scholar"
                                  ? "bg-purple-100 text-purple-800 border-purple-300"
                                  : ""
                            }
                          >
                            {t(`admin.role_${user.role}`)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={user.status === "active" ? "default" : "destructive"}
                            className={user.status === "active" ? "bg-green-500" : ""}
                          >
                            {t(`admin.status_${user.status}`)}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openRoleDialog(user)}
                              disabled={isActionLoading}
                            >
                              <UserCog className="mr-2 h-4 w-4" />
                              {t("admin.role")}
                            </Button>
                            {user.status === "active" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleBlockUser(user.id)}
                                disabled={isActionLoading}
                              >
                                <UserX className="mr-2 h-4 w-4" />
                                {t("admin.block")}
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUnblockUser(user.id)}
                                disabled={isActionLoading}
                              >
                                <UserCheck className="mr-2 h-4 w-4" />
                                {t("admin.unblock")}
                              </Button>
                            )}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user)
                                setIsDeleteDialogOpen(true)
                              }}
                              disabled={isActionLoading}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t("admin.delete")}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {t("admin.deleteDialogTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("admin.deleteDialogDescription", { name: selectedUser?.displayName || t("admin.unknown") })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isActionLoading}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={isActionLoading}>
              {isActionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("admin.deleting")}
                </>
              ) : (
                t("admin.deleteUser")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.changeRoleTitle")}</DialogTitle>
            <DialogDescription>
              {t("admin.changeRoleDescription", { name: selectedUser?.displayName || t("admin.unknown") })}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
              <SelectTrigger>
                <SelectValue placeholder={t("admin.selectRolePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">{t("admin.role_user")}</SelectItem>
                <SelectItem value="scholar">{t("admin.role_scholar")}</SelectItem>
                <SelectItem value="admin">{t("admin.role_admin")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)} disabled={isActionLoading}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleChangeRole} disabled={isActionLoading || !selectedRole}>
              {isActionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("admin.updating")}
                </>
              ) : (
                t("admin.updateRole")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}