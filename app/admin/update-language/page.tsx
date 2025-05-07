"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/translation-context"
import { useLanguage } from "@/lib/language-context"
import { db } from "@/lib/firebase"
import { collection, getDocs, doc, writeBatch } from "firebase/firestore"

// Note: This component must be used within LanguageProvider and TranslationProvider
// to access translations from en.json and ur.json
export default function UpdateLanguageFieldsPage() {
  const [isUpdating, setIsUpdating] = useState(false)
  const [progress, setProgress] = useState({ total: 0, updated: 0 })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const { user, userRole } = useAuth()
  const { t } = useTranslation()
  const { isRTL } = useLanguage()

  const updateLanguageFields = async () => {
    if (!user || userRole !== "admin") {
      setError(t("admin.accessDeniedError"))
      return
    }

    setIsUpdating(true)
    setError(null)
    setSuccess(false)

    try {
      // Update questions
      const questionsSnapshot = await getDocs(collection(db, "questions"))
      const totalQuestions = questionsSnapshot.size
      let updatedQuestions = 0

      const batch = writeBatch(db)

      questionsSnapshot.forEach((document) => {
        const data = document.data()
        if (!data.language) {
          batch.update(doc(db, "questions", document.id), {
            language: "en", // Default to English
          })
          updatedQuestions++
        }
      })

      await batch.commit()

      // Update categories
      const categoriesSnapshot = await getDocs(collection(db, "categories"))
      const totalCategories = categoriesSnapshot.size
      let updatedCategories = 0

      const categoryBatch = writeBatch(db)

      categoriesSnapshot.forEach((document) => {
        const data = document.data()
        if (!data.language) {
          categoryBatch.update(doc(db, "categories", document.id), {
            language: "en", // Default to English
          })
          updatedCategories++
        }
      })

      await categoryBatch.commit()

      // Update users
      const usersSnapshot = await getDocs(collection(db, "users"))
      const totalUsers = usersSnapshot.size
      let updatedUsers = 0

      const userBatch = writeBatch(db)

      usersSnapshot.forEach((document) => {
        const data = document.data()
        if (!data.preferredLanguage) {
          userBatch.update(doc(db, "users", document.id), {
            preferredLanguage: "en", // Default to English
          })
          updatedUsers++
        }
      })

      await userBatch.commit()

      setProgress({
        total: totalQuestions + totalCategories + totalUsers,
        updated: updatedQuestions + updatedCategories + updatedUsers,
      })

      setSuccess(true)
    } catch (err) {
      console.error("Error updating language fields:", err)
      setError(t("admin.updateLanguageError"))
    } finally {
      setIsUpdating(false)
    }
  }

  if (!user || userRole !== "admin") {
    return (
      <div className="container py-10" dir={isRTL ? "rtl" : "ltr"}>
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.accessDeniedTitle")}</CardTitle>
            <CardDescription>{t("admin.accessDeniedDescription")}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-10" dir={isRTL ? "rtl" : "ltr"}>
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.updateLanguageTitle")}</CardTitle>
          <CardDescription>{t("admin.updateLanguageDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {isUpdating ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p>{t("admin.updating")}</p>
            </div>
          ) : success ? (
            <div className="flex flex-col items-center justify-center py-8 text-green-600">
              <CheckCircle className="h-8 w-8 mb-4" />
              <p className="text-center">
                {t("admin.updateLanguageSuccess", {
                  updated: progress.updated,
                  total: progress.total,
                })}
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 text-red-600">
              <AlertCircle className="h-8 w-8 mb-4" />
              <p>{error}</p>
            </div>
          ) : (
            <p className="text-muted-foreground">{t("admin.updateLanguageInfo")}</p>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => window.history.back()}>
            {t("common.back")}
          </Button>
          <Button onClick={updateLanguageFields} disabled={isUpdating}>
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("admin.updating")}
              </>
            ) : (
              t("admin.updateLanguageButton")
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}