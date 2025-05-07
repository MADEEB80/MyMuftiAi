"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/translation-context"
import { useLanguage } from "@/lib/language-context"
import { doc, setDoc, getFirestore } from "firebase/firestore"
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth"

// Note: This component must be used within LanguageProvider and TranslationProvider
// to access translations from en.json and ur.json
export default function AdminSetupPage() {
  const { user, userRole } = useAuth()
  const { t } = useTranslation()
  const { isRTL } = useLanguage()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  // Admin form state
  const [adminEmail, setAdminEmail] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [adminName, setAdminName] = useState("")

  // Scholar form state
  const [scholarEmail, setScholarEmail] = useState("")
  const [scholarPassword, setScholarPassword] = useState("")
  const [scholarName, setScholarName] = useState("")

  // Create admin user
  const createAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const auth = getAuth()
      const db = getFirestore()

      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword)
      const userId = userCredential.user.uid

      // Create user document with admin role
      await setDoc(doc(db, "users", userId), {
        displayName: adminName,
        email: adminEmail,
        role: "admin",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      setSuccess(t("admin.adminCreatedSuccess", { email: adminEmail }))
      setAdminEmail("")
      setAdminPassword("")
      setAdminName("")
    } catch (error: any) {
      setError(t("admin.adminCreateError", { message: error.message || t("admin.unknownError") }))
    } finally {
      setLoading(false)
    }
  }

  // Create scholar user
  const createScholar = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const auth = getAuth()
      const db = getFirestore()

      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, scholarEmail, scholarPassword)
      const userId = userCredential.user.uid

      // Create user document with scholar role
      await setDoc(doc(db, "users", userId), {
        displayName: scholarName,
        email: scholarEmail,
        role: "scholar",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      setSuccess(t("admin.scholarCreatedSuccess", { email: scholarEmail }))
      setScholarEmail("")
      setScholarPassword("")
      setScholarName("")
    } catch (error: any) {
      setError(t("admin.scholarCreateError", { message: error.message || t("admin.unknownError") }))
    } finally {
      setLoading(false)
    }
  }

  // If not admin, redirect
  if (user && userRole !== "admin") {
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
          <CardTitle>{t("admin.setupTitle")}</CardTitle>
          <CardDescription>{t("admin.setupDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t("common.error")}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">{t("common.success")}</AlertTitle>
              <AlertDescription className="text-green-700">{success}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="admin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="admin">{t("admin.createAdmin")}</TabsTrigger>
              <TabsTrigger value="scholar">{t("admin.createScholar")}</TabsTrigger>
            </TabsList>

            <TabsContent value="admin">
              <form onSubmit={createAdmin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="adminName">{t("admin.fullName")}</Label>
                  <Input
                    id="adminName"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder={t("admin.namePlaceholder")}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminEmail">{t("admin.email")}</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder={t("admin.emailPlaceholderAdmin")}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminPassword">{t("admin.password")}</Label>
                  <Input
                    id="adminPassword"
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder={t("admin.passwordPlaceholder")}
                    required
                    minLength={8}
                  />
                  <p className="text-xs text-gray-500">{t("admin.passwordHint")}</p>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("admin.creating")}
                    </>
                  ) : (
                    t("admin.createAdminButton")
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="scholar">
              <form onSubmit={createScholar} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="scholarName">{t("admin.fullName")}</Label>
                  <Input
                    id="scholarName"
                    value={scholarName}
                    onChange={(e) => setScholarName(e.target.value)}
                    placeholder={t("admin.namePlaceholder")}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scholarEmail">{t("admin.email")}</Label>
                  <Input
                    id="scholarEmail"
                    type="email"
                    value={scholarEmail}
                    onChange={(e) => setScholarEmail(e.target.value)}
                    placeholder={t("admin.emailPlaceholderScholar")}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scholarPassword">{t("admin.password")}</Label>
                  <Input
                    id="scholarPassword"
                    type="password"
                    value={scholarPassword}
                    onChange={(e) => setScholarPassword(e.target.value)}
                    placeholder={t("admin.passwordPlaceholder")}
                    required
                    minLength={8}
                  />
                  <p className="text-xs text-gray-500">{t("admin.passwordHint")}</p>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("admin.creating")}
                    </>
                  ) : (
                    t("admin.createScholarButton")
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h3 className="font-medium mb-2">{t("admin.otherMethodsTitle")}</h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>{t("admin.otherMethod1")}</li>
              <li>{t("admin.otherMethod2")}</li>
              <li>{t("admin.otherMethod3")}</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}