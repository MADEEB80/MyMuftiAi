"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, Check, ArrowLeft } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { useTranslation } from "@/lib/translation-context"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Note: This component must be used within LanguageProvider and TranslationProvider
// to access translations from en.json and ur.json
export default function ProfileEditPage() {
  const [profile, setProfile] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const { user, userRole } = useAuth()
  const { isRTL } = useLanguage()
  const { t } = useTranslation()
  const router = useRouter()

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        router.push("/auth/login")
        return
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid))

        if (userDoc.exists()) {
          setProfile({
            displayName: userDoc.data().displayName || user.displayName || "",
            email: userDoc.data().email || user.email || "",
            bio: userDoc.data().bio || "",
            location: userDoc.data().location || "",
            website: userDoc.data().website || "",
            phoneNumber: userDoc.data().phoneNumber || "",
          })
        } else {
          setProfile({
            displayName: user.displayName || "",
            email: user.email || "",
            bio: "",
            location: "",
            website: "",
            phoneNumber: "",
          })
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
        setError(t("profile.errorLoading"))
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user, router, t])

  const handleUpdateProfile = async () => {
    if (!user) return

    setSaving(true)
    setError("")
    setSuccess("")

    try {
      await updateDoc(doc(db, "users", user.uid), {
        displayName: profile.displayName,
        bio: profile.bio,
        location: profile.location,
        website: profile.website,
        phoneNumber: profile.phoneNumber,
        updatedAt: new Date(),
      })

      setSuccess(t("profile.successMessage"))

      // Redirect back to profile page after a short delay
      setTimeout(() => {
        router.push("/profile")
      }, 2000)
    } catch (error) {
      console.error("Error updating profile:", error)
      setError(t("profile.errorSaving"))
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProfile({
      ...profile,
      [name]: value,
    })
  }

  if (loading) {
    return (
      <div className="container flex h-[calc(100vh-200px)] items-center justify-center" dir={isRTL ? "rtl" : "ltr"}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container py-10" dir={isRTL ? "rtl" : "ltr"}>
        <Card>
          <CardHeader>
            <CardTitle>{t("common.authentication_required")}</CardTitle>
            <CardDescription>{t("profile.pleaseSignIn")}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push("/auth/login")} className="w-full">
              {t("common.sign_in")}
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-10" dir={isRTL ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-2xl">
        <Button variant="outline" className="mb-6" onClick={() => router.push("/profile")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("profile.backToProfile")}
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.photoURL || ""} alt={profile.displayName} />
                <AvatarFallback className="text-xl">
                  {profile.displayName?.charAt(0) || user.email?.charAt(0) || t("profile.fallbackInitial")}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{t("profile.title")}</CardTitle>
                <CardDescription>{t("profile.description")}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-500 bg-green-50 text-green-700">
                <Check className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="displayName">{t("profile.fullNameLabel")}</Label>
              <Input
                id="displayName"
                name="displayName"
                value={profile.displayName}
                onChange={handleInputChange}
                placeholder={t("profile.fullNamePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("profile.emailLabel")}</Label>
              <Input id="email" name="email" value={profile.email} disabled />
              <p className="text-xs text-muted-foreground">{t("profile.emailDisabled")}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">{t("profile.bioLabel")}</Label>
              <Textarea
                id="bio"
                name="bio"
                value={profile.bio}
                onChange={handleInputChange}
                placeholder={t("profile.bioPlaceholder")}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">{t("profile.locationLabel")}</Label>
              <Input
                id="location"
                name="location"
                value={profile.location}
                onChange={handleInputChange}
                placeholder={t("profile.locationPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">{t("profile.websiteLabel")}</Label>
              <Input
                id="website"
                name="website"
                value={profile.website}
                onChange={handleInputChange}
                placeholder={t("profile.websitePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">{t("profile.phoneNumberLabel")}</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                value={profile.phoneNumber}
                onChange={handleInputChange}
                placeholder={t("profile.phoneNumberPlaceholder")}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => router.push("/profile")}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleUpdateProfile} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("common.saving")}
                </>
              ) : (
                t("profile.saveChanges")
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}