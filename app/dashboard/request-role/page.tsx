"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useTranslation } from "@/lib/translation-context"
import { useLanguage } from "@/lib/language-context"
import type { UserRole } from "@/lib/user-service"

// Note: This component must be used within LanguageProvider and TranslationProvider
// to access translations from en.json and ur.json
export default function RequestRolePage() {
  const [requestedRole, setRequestedRole] = useState<UserRole | "">("")
  const [qualifications, setQualifications] = useState("")
  const [institution, setInstitution] = useState("")
  const [experience, setExperience] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { user } = useAuth()
  const { t } = useTranslation()
  const { isRTL } = useLanguage()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)
    setIsLoading(true)

    if (!user) {
      setError(t("requestRole.errorNotLoggedIn"))
      setIsLoading(false)
      return
    }

    if (!requestedRole) {
      setError(t("requestRole.errorNoRoleSelected"))
      setIsLoading(false)
      return
    }

    try {
      await addDoc(collection(db, "roleRequests"), {
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || t("common.anonymous"),
        requestedRole,
        qualifications,
        institution,
        experience,
        status: "pending",
        createdAt: serverTimestamp(),
      })

      setSuccess(true)

      // Reset form after successful submission
      setRequestedRole("")
      setQualifications("")
      setInstitution("")
      setExperience("")

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push("/dashboard")
      }, 3000)
    } catch (error: any) {
      setError(error.message || t("requestRole.errorSubmitting"))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container py-10" dir={isRTL ? "rtl" : "ltr"}>
      <Card className="mx-auto max-w-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">{t("requestRole.title")}</CardTitle>
          <CardDescription>{t("requestRole.description")}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="border-green-500 bg-green-50 text-green-700">
                <AlertDescription>{t("requestRole.successMessage")}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="role">{t("requestRole.roleLabel")}</Label>
              <Select value={requestedRole} onValueChange={(value) => setRequestedRole(value as UserRole)} required>
                <SelectTrigger id="role">
                  <SelectValue placeholder={t("requestRole.rolePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scholar">{t("requestRole.scholar")}</SelectItem>
                  <SelectItem value="admin">{t("requestRole.admin")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="qualifications">{t("requestRole.qualificationsLabel")}</Label>
              <Textarea
                id="qualifications"
                placeholder={t("requestRole.qualificationsPlaceholder")}
                value={qualifications}
                onChange={(e) => setQualifications(e.target.value)}
                className="min-h-[100px]"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="institution">{t("requestRole.institutionLabel")}</Label>
              <Input
                id="institution"
                placeholder={t("requestRole.institutionPlaceholder")}
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="experience">{t("requestRole.experienceLabel")}</Label>
              <Textarea
                id="experience"
                placeholder={t("requestRole.experiencePlaceholder")}
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="min-h-[100px]"
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading || success}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("common.submitting")}
                </>
              ) : (
                t("requestRole.submitButton")
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}