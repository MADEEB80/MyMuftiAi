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

export default function SubmitDraftPage({ params }: { params: { id: string } }) {
  const [draftData, setDraftData] = useState<any>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { user } = useAuth()
  const { t } = useTranslation()

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
            setError("You don't have permission to submit this draft")
            return
          }

          // Verify this is a draft
          if (data.status !== "draft") {
            setError("This question is no longer a draft and cannot be submitted")
            return
          }

          setDraftData({
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
          })
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

  const handleSubmitDraft = async () => {
    setError("")
    setSuccess(false)
    setIsSubmitting(true)

    if (!user) {
      setError("You must be logged in to submit a question")
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
      setError(error.message || "Failed to submit draft")
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date)
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
          <CardTitle className="text-2xl font-bold">{t("submit_draft")}</CardTitle>
          <CardDescription>{t("submit_draft_description")}</CardDescription>
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
                  <AlertDescription>{t("draft_submitted_successfully")}</AlertDescription>
                </Alert>
              )}

              <div>
                <h3 className="font-semibold text-lg">{t("question_title")}</h3>
                <p className="mt-1">{draftData?.title}</p>
              </div>

              <div>
                <h3 className="font-semibold text-lg">{t("category")}</h3>
                <p className="mt-1 capitalize">{draftData?.category}</p>
              </div>

              <div>
                <h3 className="font-semibold text-lg">{t("your_question")}</h3>
                <div className="mt-1 p-4 bg-muted rounded-md whitespace-pre-line">{draftData?.question}</div>
              </div>

              <div>
                <h3 className="font-semibold text-lg">{t("created_on")}</h3>
                <p className="mt-1">{draftData?.createdAt && formatDate(draftData.createdAt)}</p>
              </div>

              <Alert>
                <AlertDescription>{t("submit_draft_warning")}</AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => router.push(`/dashboard/edit/${params.id}`)}
                disabled={isSubmitting}
              >
                <Edit className="mr-2 h-4 w-4" />
                {t("edit_draft")}
              </Button>
              <Button onClick={handleSubmitDraft} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("submitting")}
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    {t("submit_question")}
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
