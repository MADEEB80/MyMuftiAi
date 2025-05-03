"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2, Save, ArrowLeft } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useTranslation } from "@/lib/translation-context"

const categories = [
  { value: "prayers", label: "Prayers (Salah)" },
  { value: "fasting", label: "Fasting (Sawm)" },
  { value: "zakat", label: "Charity (Zakat)" },
  { value: "hajj", label: "Pilgrimage (Hajj)" },
  { value: "business", label: "Business & Finance" },
  { value: "family", label: "Family & Relationships" },
  { value: "general", label: "General Questions" },
]

export default function EditDraftPage({ params }: { params: { id: string } }) {
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [question, setQuestion] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const { user } = useAuth()
  const { t, language } = useTranslation()

  // Fetch the draft question
  useEffect(() => {
    const fetchDraft = async () => {
      if (!user) return

      try {
        const docRef = doc(db, "questions", params.id)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data()

          // Verify this is the user's draft
          if (data.userId !== user.uid) {
            setError("You don't have permission to edit this draft")
            return
          }

          // Verify this is a draft
          if (data.status !== "draft") {
            setError("This question is no longer a draft and cannot be edited")
            return
          }

          setTitle(data.title || "")
          setCategory(data.category || "")
          setQuestion(data.question || "")
        } else {
          setError("Draft not found")
        }
      } catch (error: any) {
        console.error("Error fetching draft:", error)
        setError(error.message || "Failed to load draft")
      } finally {
        setIsLoading(false)
      }
    }

    fetchDraft()
  }, [params.id, user])

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)
    setIsSaving(true)

    if (!user) {
      setError("You must be logged in to save a draft")
      setIsSaving(false)
      return
    }

    try {
      // Validate form
      if (!title.trim() || !category || !question.trim()) {
        throw new Error("Please fill in all fields")
      }

      // Update draft
      await updateDoc(doc(db, "questions", params.id), {
        title,
        category,
        question,
        updatedAt: serverTimestamp(),
      })

      setSuccess(true)

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)
    } catch (error: any) {
      console.error("Error saving draft:", error)
      setError(error.message || "Failed to save draft")
    } finally {
      setIsSaving(false)
    }
  }

  if (!user) {
    return (
      <div className="container flex h-[calc(100vh-200px)] items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>{t("authentication_required")}</CardTitle>
            <CardDescription>{t("please_sign_in")}</CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={() => router.push("/auth/login")}>{t("sign_in")}</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <Button variant="outline" className="mb-6" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t("back")}
      </Button>

      <Card className="mx-auto max-w-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">{t("edit_draft")}</CardTitle>
          <CardDescription>{t("edit_draft_description")}</CardDescription>
        </CardHeader>
        {isLoading ? (
          <CardContent className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        ) : (
          <form onSubmit={handleSaveDraft}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert className="border-green-500 bg-green-50 text-green-700">
                  <AlertDescription>{t("draft_saved_successfully")}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="title">{t("question_title")}</Label>
                <Input
                  id="title"
                  placeholder={t("brief_title_placeholder")}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">{t("category")}</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger id="category">
                    <SelectValue placeholder={t("select_category")} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {language === "en" ? cat.label : t(`category_${cat.value}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="question">{t("your_question")}</Label>
                <Textarea
                  id="question"
                  placeholder={t("question_details_placeholder")}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="min-h-[200px]"
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => router.push("/dashboard")} disabled={isSaving}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("saving")}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {t("save_draft")}
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  )
}
