'use client';

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
          name: data.name || "Unknown",
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
        throw new Error("Category name and value are required")
      }

      // Check for duplicate value
      const isDuplicate = categories.some((category) => category.value.toLowerCase() === categoryValue.toLowerCase())

      if (isDuplicate) {
        throw new Error("A category with this value already exists")
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
        throw new Error("Category name and value are required")
      }

      // Check for duplicate value (excluding the current category)
      const isDuplicate = categories.some(
        (category) =>
          category.id !== selectedCategory.id && category.value.toLowerCase() === categoryValue.toLowerCase(),
      )

      if (isDuplicate) {
        throw new Error("A category with this value already exists")
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

  return (
    <div className="container py-10">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Category Management</CardTitle>
            <CardDescription>Manage question categories</CardDescription>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
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
                    <TableHead>Name</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Questions</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No categories found.
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
                              Edit
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
                              Delete
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>Create a new category for organizing questions</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name</Label>
              <Input
                id="name"
                placeholder="e.g. Prayers (Salah)"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">Category Value</Label>
              <Input
                id="value"
                placeholder="e.g. prayers"
                value={categoryValue}
                onChange={(e) => setCategoryValue(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                This is used in URLs and for filtering. Use lowercase letters and hyphens only.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this category"
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
              Cancel
            </Button>
            <Button onClick={handleAddCategory} disabled={isActionLoading}>
              {isActionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Category"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update category information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Category Name</Label>
              <Input id="edit-name" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-value">Category Value</Label>
              <Input id="edit-value" value={categoryValue} onChange={(e) => setCategoryValue(e.target.value)} />
              <p className="text-xs text-muted-foreground">
                This is used in URLs and for filtering. Use lowercase letters and hyphens only.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
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
              Cancel
            </Button>
            <Button onClick={handleEditCategory} disabled={isActionLoading}>
              {isActionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Category"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the category "{selectedCategory?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isActionLoading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCategory} disabled={isActionLoading}>
              {isActionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Category"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}