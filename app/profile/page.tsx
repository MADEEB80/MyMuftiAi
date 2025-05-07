"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, Check, User, Lock, Bell, Shield, GraduationCap } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { useTranslation } from "@/lib/translation-context"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

// Note: This component must be used within LanguageProvider and TranslationProvider
// to access translations from en.json and ur.json
export default function ProfilePage() {
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
            emailNotifications: userDoc.data().emailNotifications !== false,
            pushNotifications: userDoc.data().pushNotifications !== false,
          })
        } else {
          setProfile({
            displayName: user.displayName || "",
            email: user.email || "",
            bio: "",
            location: "",
            website: "",
            phoneNumber: "",
            emailNotifications: true,
            pushNotifications: true,
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
        emailNotifications: profile.emailNotifications,
        pushNotifications: profile.pushNotifications,
        updatedAt: new Date(),
      })

      setSuccess(t("profile.successMessage"))
    } catch (error) {
      console.error("Error updating profile:", error)
      setError(t("profile.errorSaving"))
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setProfile({
      ...profile,
      [name]: type === "checkbox" ? checked : value,
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
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">{t("nav.profile")}</h1>
          <Button onClick={() => router.push("/dashboard")}>{t("profile.backToDashboard")}</Button>
        </div>

        <div className="grid gap-8 md:grid-cols-[1fr_3fr]">
          {/* Profile Sidebar */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user.photoURL || ""} alt={profile.displayName} />
                  <AvatarFallback className="text-2xl">
                    {profile.displayName?.charAt(0) || user.email?.charAt(0) || t("profile.fallbackInitial")}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <h2 className="text-xl font-bold">{profile.displayName}</h2>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                  {userRole && (
                    <Badge className="mt-2">{t(`dashboard.role_${userRole}`)}</Badge>
                  )}
                </div>
                <Button variant="outline" className="w-full" onClick={() => router.push("/profile/edit")}>
                  {t("profile.editProfile")}
                </Button>

                {/* Admin Panel Link */}
                {userRole === "admin" && (
                  <Button
                    variant="default"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => router.push("/admin/dashboard")}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    {t("nav.adminPanel")}
                  </Button>
                )}

                {/* Scholar Panel Link */}
                {userRole === "scholar" && (
                  <Button
                    variant="default"
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => router.push("/scholar/dashboard")}
                  >
                    <GraduationCap className="mr-2 h-4 w-4" />
                    {t("nav.scholarPanel")}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Profile Content */}
          <div className="space-y-6">
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

            <Tabs defaultValue="profile">
              <TabsList className="mb-4">
                <TabsTrigger value="profile">
                  <User className="mr-2 h-4 w-4" />
                  {t("profile.tabProfile")}
                </TabsTrigger>
                <TabsTrigger value="security">
                  <Lock className="mr-2 h-4 w-4" />
                  {t("profile.tabSecurity")}
                </TabsTrigger>
                <TabsTrigger value="notifications">
                  <Bell className="mr-2 h-4 w-4" />
                  {t("profile.tabNotifications")}
                </TabsTrigger>
                {userRole === "admin" && (
                  <TabsTrigger value="admin">
                    <Shield className="mr-2 h-4 w-4" />
                    {t("profile.tabAdmin")}
                  </TabsTrigger>
                )}
                {userRole === "scholar" && (
                  <TabsTrigger value="scholar">
                    <GraduationCap className="mr-2 h-4 w-4" />
                    {t("profile.tabScholar")}
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle>{t("profile.profileInfoTitle")}</CardTitle>
                    <CardDescription>{t("profile.profileInfoDescription")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                      <Input
                        id="bio"
                        name="bio"
                        value={profile.bio}
                        onChange={handleInputChange}
                        placeholder={t("profile.bioPlaceholder")}
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
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
                  <CardFooter>
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
              </TabsContent>

              <TabsContent value="security">
                <Card>
                  <CardHeader>
                    <CardTitle>{t("profile.securitySettingsTitle")}</CardTitle>
                    <CardDescription>{t("profile.securitySettingsDescription")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>{t("profile.passwordLabel")}</Label>
                      <div className="flex items-center justify-between rounded-md border p-3">
                        <div>
                          <p className="font-medium">{t("profile.changePassword")}</p>
                          <p className="text-sm text-muted-foreground">{t("profile.changePasswordDescription")}</p>
                        </div>
                        <Button variant="outline" onClick={() => router.push("/auth/forgot-password")}>
                          {t("profile.changeButton")}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notifications">
                <Card>
                  <CardHeader>
                    <CardTitle>{t("profile.notificationSettingsTitle")}</CardTitle>
                    <CardDescription>{t("profile.notificationSettingsDescription")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between space-x-2">
                      <Label htmlFor="emailNotifications" className="flex flex-col space-y-1">
                        <span>{t("profile.emailNotificationsLabel")}</span>
                        <span className="font-normal text-sm text-muted-foreground">
                          {t("profile.emailNotificationsDescription")}
                        </span>
                      </Label>
                      <input
                        type="checkbox"
                        id="emailNotifications"
                        name="emailNotifications"
                        checked={profile.emailNotifications}
                        onChange={handleInputChange}
                        className="h-4 w-4"
                      />
                    </div>
                    <div className="flex items-center justify-between space-x-2">
                      <Label htmlFor="pushNotifications" className="flex flex-col space-y-1">
                        <span>{t("profile.pushNotificationsLabel")}</span>
                        <span className="font-normal text-sm text-muted-foreground">
                          {t("profile.pushNotificationsDescription")}
                        </span>
                      </Label>
                      <input
                        type="checkbox"
                        id="pushNotifications"
                        name="pushNotifications"
                        checked={profile.pushNotifications}
                        onChange={handleInputChange}
                        className="h-4 w-4"
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
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
              </TabsContent>

              {userRole === "admin" && (
                <TabsContent value="admin">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t("profile.adminSettingsTitle")}</CardTitle>
                      <CardDescription>{t("profile.adminSettingsDescription")}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button variant="default" onClick={() => router.push("/admin/dashboard")} className="w-full">
                          <Shield className="mr-2 h-4 w-4" />
                          {t("profile.adminDashboard")}
                        </Button>
                        <Button variant="outline" onClick={() => router.push("/admin/questions")} className="w-full">
                          {t("profile.manageQuestions")}
                        </Button>
                        <Button variant="outline" onClick={() => router.push("/admin/users")} className="w-full">
                          {t("dashboard.manageUsers")}
                        </Button>
                        <Button variant="outline" onClick={() => router.push("/admin/categories")} className="w-full">
                          {t("dashboard.manageCategories")}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {userRole === "scholar" && (
                <TabsContent value="scholar">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t("profile.scholarSettingsTitle")}</CardTitle>
                      <CardDescription>{t("profile.scholarSettingsDescription")}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button
                          variant="default"
                          onClick={() => router.push("/scholar/dashboard")}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          <GraduationCap className="mr-2 h-4 w-4" />
                          {t("profile.scholarDashboard")}
                        </Button>
                        <Button variant="outline" onClick={() => router.push("/scholar/questions")} className="w-full">
                          {t("profile.viewAssignedQuestions")}
                        </Button>
                        <Button variant="outline" onClick={() => router.push("/scholar/answered")} className="w-full">
                          {t("profile.viewAnsweredQuestions")}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}