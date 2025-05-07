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
import { useLanguage } from "@/lib/language-context"

// Note: This component must be used within LanguageProvider and TranslationProvider
// to access translations from en.json and ur.json
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
  const { t } = useTranslation()
  const { isRTL } = useLanguage()

  const categories = [
    { value: "prayers", key: "category_prayers" },
    { value: "fasting", key: "category_fasting" },
    { value: "zakat", key: "category_zakat" },
    { value: "hajj", key: "category_hajj" },
    { value: "business", key: "category_business" },
    { value: "family", key: "category_family" },
    { value: "general", key: "category_general" },
  ]

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
            setError(t("editDraft.errorNoPermission"))
            return
          }

          // Verify this is a draft
          if (data.status !== "draft") {
            setError(t("editDraft.errorNotDraft"))
            return
          }

          setTitle(data.title || "")
          setCategory(data.category || "")
          setQuestion(data.question || "")
        } else {
          setError(t("editDraft.errorNotFound"))
        }
      } catch (error: any) {
        console.error("Error fetching draft:", error)
        setError(error.message || t("editDraft.errorLoading"))
      } finally {
        setIsLoading(false)
      }
    }

    fetchDraft()
  }, [params.id, user, t])

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)
    setIsSaving(true)

    if (!user) {
      setError(t("editDraft.errorNotLoggedIn"))
      setIsSaving(false)
      return
    }

    try {
      // Validate form
      if (!title.trim() || !category || !question.trim()) {
        throw new Error(t("editDraft.errorIncompleteFields"))
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
      setError(error.message || t("editDraft.errorSaving"))
    } finally {
      setIsSaving(false)
    }
  }

  if (!user) {
    return (
      <div className="container flex h-[calc(100vh-200px)] items-center justify-center" dir={isRTL ? "rtl" : "ltr"}>
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>{t("common.authentication_required")}</CardTitle>
            <CardDescription>{t("common.please_sign_in")}</CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={() => router.push("/auth/login")}>{t("common.sign_in")}</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-10" dir={isRTL ? "rtl" : "ltr"}>
      <Button variant="outline" className="mb-6" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t("common.back")}
      </Button>

      <Card className="mx-auto max-w-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">{t("editDraft.title")}</CardTitle>
          <CardDescription>{t("editDraft.description")}</CardDescription>
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
                  <AlertDescription>{t("editDraft.successMessage")}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="title">{t("editDraft.titleLabel")}</Label>
                <Input
                  id="title"
                  placeholder={t("editDraft.titlePlaceholder")}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">{t("editDraft.categoryLabel")}</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger id="category">
                    <SelectValue placeholder={t("editDraft.categoryPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {t(cat.key)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="question">{t("editDraft.questionLabel")}</Label>
                <Textarea
                  id="question"
                  placeholder={t("editDraft.questionPlaceholder")}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="min-h-[200px]"
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => router.push("/dashboard")} disabled={isSaving}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.saving")}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {t("editDraft.saveButton")}
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