"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2, ArrowLeft, Send, Edit } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useTranslation } from "@/lib/translation-context"
import { useLanguage } from "@/lib/language-context"

// Note: This component must be used within LanguageProvider and TranslationProvider
// to access translations from en.json and ur.json
export default function SubmitDraftPage({ params }: { params: { id: string } }) {
  const [draftData, setDraftData] = useState<any>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { user } = useAuth()
  const { t } = useTranslation()
  const { isRTL } = useLanguage()

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
            setError(t("submitDraft.errorNoPermission"))
            return
          }

          // Verify this is a draft
          if (data.status !== "draft") {
            setError(t("submitDraft.errorNotDraft"))
            return
          }

          setDraftData({
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
          })
        } else {
          setError(t("submitDraft.errorNotFound"))
        }
      } catch (error: any) {
        console.error("Error fetching draft:", error)
        setError(error.message || t("submitDraft.errorLoading"))
      } finally {
        setIsLoading(false)
      }
    }

    fetchDraft()
  }, [params.id, user, t])

  const handleSubmitDraft = async () => {
    setError("")
    setSuccess(false)
    setIsSubmitting(true)

    if (!user) {
      setError(t("submitDraft.errorNotLoggedIn"))
      setIsSubmitting(false)
      return
    }

    try {
      // Update draft status to pending
      await updateDoc(doc(db, "questions", params.id), {
        status: "pending",
        updatedAt: serverTimestamp(),
      })

      setSuccess(true)

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)
    } catch (error: any) {
      console.error("Error submitting draft:", error)
      setError(error.message || t("submitDraft.errorSubmitting"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(isRTL ? "ur-PK" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date)
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
          <CardTitle className="text-2xl font-bold">{t("submitDraft.title")}</CardTitle>
          <CardDescription>{t("submitDraft.description")}</CardDescription>
        </CardHeader>
        {isLoading ? (
          <CardContent className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        ) : error ? (
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        ) : (
          <>
            <CardContent className="space-y-4">
              {success && (
                <Alert className="border-green-500 bg-green-50 text-green-700">
                  <AlertDescription>{t("submitDraft.successMessage")}</AlertDescription>
                </Alert>
              )}

              <div>
                <h3 className="font-semibold text-lg">{t("submitDraft.titleLabel")}</h3>
                <p className="mt-1">{draftData?.title}</p>
              </div>

              <div>
                <h3 className="font-semibold text-lg">{t("submitDraft.categoryLabel")}</h3>
                <p className="mt-1">{t(`category_${draftData?.category}`)}</p>
              </div>

              <div>
                <h3 className="font-semibold text-lg">{t("submitDraft.questionLabel")}</h3>
                <div className="mt-1 p-4 bg-muted rounded-md whitespace-pre-line">{draftData?.question}</div>
              </div>

              <div>
                <h3 className="font-semibold text-lg">{t("submitDraft.createdOnLabel")}</h3>
                <p className="mt-1">{draftData?.createdAt && formatDate(draftData.createdAt)}</p>
              </div>

              <Alert>
                <AlertDescription>{t("submitDraft.warning")}</AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => router.push(`/dashboard/edit/${params.id}`)}
                disabled={isSubmitting}
              >
                <Edit className="mr-2 h-4 w-4" />
                {t("common.edit_draft")}
              </Button>
              <Button onClick={handleSubmitDraft} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.submitting")}
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    {t("submitDraft.submitButton")}
                  </>
                )}
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  )
}