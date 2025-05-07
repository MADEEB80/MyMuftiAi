"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
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
import { Loader2, Plus, Pencil, Trash2, AlertTriangle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/translation-context"
import { useLanguage } from "@/lib/language-context"
import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  where,
  getCountFromServer,
} from "firebase/firestore"
import { db } from "@/lib/firebase"

interface Category {
  id: string
  name: string
  value: string
  description: string
  questionCount: number
  createdAt: Date
  updatedAt?: Date
}

// Note: This component must be used within LanguageProvider and TranslationProvider
// to access translations from en.json and ur.json
export default function CategoriesManagementPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [isActionLoading, setIsActionLoading] = useState(false)

  // Form states
  const [categoryName, setCategoryName] = useState("")
  const [categoryValue, setCategoryValue] = useState("")
  const [categoryDescription, setCategoryDescription] = useState("")

  const { user, userRole } = useAuth()
  const router = useRouter()
  const { t } = useTranslation()
  const { isRTL } = useLanguage()

  useEffect(() => {
    if (user && userRole === "admin") {
      fetchCategories()
    } else if (!loading) {
      router.push("/")
    }
  }, [user, userRole, loading, router])

  const fetchCategories = async () => {
    try {
      const q = query(collection(db, "categories"), orderBy("name", "asc"))

      const querySnapshot = await getDocs(q)
      const fetchedCategories: Category[] = []

      for (const doc of querySnapshot.docs) {
        const data = doc.data()

        // Get question count for this category
        const questionsQuery = query(collection(db, "questions"), where("category", "==", data.value || doc.id))
        const questionsSnapshot = await getCountFromServer(questionsQuery)
        const questionCount = questionsSnapshot.data().count

        fetchedCategories.push({
          id: doc.id,
          name: data.name || t("admin.unknown"),
          value: data.value || doc.id,
          description: data.description || "",
          questionCount: questionCount,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate(),
        })
      }

      setCategories(fetchedCategories)
    } catch (error) {
      console.error("Error fetching categories:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCategory = async () => {
    setIsActionLoading(true)
    try {
      // Validate form
      if (!categoryName.trim() || !categoryValue.trim()) {
        throw new Error(t("admin.validationError"))
      }

      // Check for duplicate value
      const isDuplicate = categories.some((category) => category.value.toLowerCase() === categoryValue.toLowerCase())

      if (isDuplicate) {
        throw new Error(t("admin.duplicateError"))
      }

      // Add new category
      await addDoc(collection(db, "categories"), {
        name: categoryName,
        value: categoryValue.toLowerCase(),
        description: categoryDescription,
        questionCount: 0,
        createdAt: serverTimestamp(),
      })

      // Refresh categories
      await fetchCategories()

      // Reset form and close dialog
      resetForm()
      setIsAddDialogOpen(false)
    } catch (error: any) {
      console.error("Error adding category:", error)
      alert(error.message)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleEditCategory = async () => {
    if (!selectedCategory) return

    setIsActionLoading(true)
    try {
      // Validate form
      if (!categoryName.trim() || !categoryValue.trim()) {
        throw new Error(t("admin.validationError"))
      }

      // Check for duplicate value (excluding the current category)
      const isDuplicate = categories.some(
        (category) =>
          category.id !== selectedCategory.id && category.value.toLowerCase() === categoryValue.toLowerCase(),
      )

      if (isDuplicate) {
        throw new Error(t("admin.duplicateError"))
      }

      // Update category
      await updateDoc(doc(db, "categories", selectedCategory.id), {
        name: categoryName,
        value: categoryValue.toLowerCase(),
        description: categoryDescription,
        updatedAt: serverTimestamp(),
      })

      // Refresh categories
      await fetchCategories()

      // Reset form and close dialog
      resetForm()
      setIsEditDialogOpen(false)
    } catch (error: any) {
      console.error("Error updating category:", error)
      alert(error.message)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return

    setIsActionLoading(true)
    try {
      // Delete category
      await deleteDoc(doc(db, "categories", selectedCategory.id))

      // Update local state
      setCategories((prevCategories) => prevCategories.filter((category) => category.id !== selectedCategory.id))

      // Close dialog
      setIsDeleteDialogOpen(false)
      setSelectedCategory(null)
    } catch (error) {
      console.error("Error deleting category:", error)
    } finally {
      setIsActionLoading(false)
    }
  }

  const resetForm = () => {
    setCategoryName("")
    setCategoryValue("")
    setCategoryDescription("")
    setSelectedCategory(null)
  }

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category)
    setCategoryName(category.name)
    setCategoryValue(category.value)
    setCategoryDescription(category.description)
    setIsEditDialogOpen(true)
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

  return (
    <div className="container py-10" dir={isRTL ? "rtl" : "ltr"}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t("admin.title")}</CardTitle>
            <CardDescription>{t("admin.description")}</CardDescription>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("admin.addCategory")}
          </Button>
        </CardHeader>
        <CardContent>
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
                    <TableHead>{t("admin.value")}</TableHead>
                    <TableHead>{t("admin.description")}</TableHead>
                    <TableHead>{t("common.questions")}</TableHead>
                    <TableHead>{t("admin.created")}</TableHead>
                    <TableHead className="text-right">{t("admin.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        {t("admin.noCategories")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>{category.value}</TableCell>
                        <TableCell className="max-w-xs truncate">{category.description}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{category.questionCount}</Badge>
                        </TableCell>
                        <TableCell>{formatDate(category.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(category)}
                              disabled={isActionLoading}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              {t("common.edit")}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setSelectedCategory(category)
                                setIsDeleteDialogOpen(true)
                              }}
                              disabled={isActionLoading}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t("common.delete")}
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

      {/* Add Category Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>{t("admin.addDialogTitle")}</DialogTitle>
            <DialogDescription>{t("admin.addDialogDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">{t("admin.name")}</Label>
              <Input
                id="name"
                placeholder={t("admin.namePlaceholder")}
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">{t("admin.value")}</Label>
              <Input
                id="value"
                placeholder={t("admin.valuePlaceholder")}
                value={categoryValue}
                onChange={(e) => setCategoryValue(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {t("admin.valueHint")}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t("admin.description")}</Label>
              <Textarea
                id="description"
                placeholder={t("admin.descriptionPlaceholder")}
                value={categoryDescription}
                onChange={(e) => setCategoryDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                resetForm()
                setIsAddDialogOpen(false)
              }}
              disabled={isActionLoading}
            >
              {t("common.cancel")}
            </Button>
            <Button onClick={handleAddCategory} disabled={isActionLoading}>
              {isActionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("admin.adding")}
                </>
              ) : (
                t("admin.addCategory")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>{t("admin.editDialogTitle")}</DialogTitle>
            <DialogDescription>{t("admin.editDialogDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">{t("admin.name")}</Label>
              <Input id="edit-name" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-value">{t("admin.value")}</Label>
              <Input id="edit-value" value={categoryValue} onChange={(e) => setCategoryValue(e.target.value)} />
              <p className="text-xs text-muted-foreground">
                {t("admin.valueHint")}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">{t("admin.description")}</Label>
              <Textarea
                id="edit-description"
                value={categoryDescription}
                onChange={(e) => setCategoryDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                resetForm()
                setIsEditDialogOpen(false)
              }}
              disabled={isActionLoading}
            >
              {t("common.cancel")}
            </Button>
            <Button onClick={handleEditCategory} disabled={isActionLoading}>
              {isActionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("admin.updating")}
                </>
              ) : (
                t("admin.updateCategory")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {t("admin.deleteDialogTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("admin.deleteDialogDescription", { name: selectedCategory?.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isActionLoading}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDeleteCategory} disabled={isActionLoading}>
              {isActionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("admin.deleting")}
                </>
              ) : (
                t("admin.deleteCategory")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}