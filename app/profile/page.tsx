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
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useTranslation } from "@/lib/translation-context"

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const { user, userRole } = useAuth()
  const router = useRouter()
  const { t } = useTranslation()

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
        setError("Failed to load profile data")
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user, router])

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

      setSuccess("Profile updated successfully")
    } catch (error) {
      console.error("Error updating profile:", error)
      setError("Failed to update profile")
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
      <div className="container flex h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please sign in to view your profile</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push("/auth/login")} className="w-full">
              Sign In
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Profile</h1>
          <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
        </div>

        <div className="grid gap-8 md:grid-cols-[1fr_3fr]">
          {/* Profile Sidebar */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user.photoURL || ""} alt={profile.displayName} />
                  <AvatarFallback className="text-2xl">
                    {profile.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <h2 className="text-xl font-bold">{profile.displayName}</h2>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                  {userRole && <Badge className="mt-2">{userRole.charAt(0).toUpperCase() + userRole.slice(1)}</Badge>}
                </div>
                <Button variant="outline" className="w-full" onClick={() => router.push("/profile/edit")}>
                  Edit Profile
                </Button>

                {/* Admin Panel Link */}
                {userRole === "admin" && (
                  <Button
                    variant="default"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => router.push("/admin/dashboard")}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Go to Admin Panel
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
                    Go to Scholar Panel
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
                  Profile
                </TabsTrigger>
                <TabsTrigger value="security">
                  <Lock className="mr-2 h-4 w-4" />
                  Security
                </TabsTrigger>
                <TabsTrigger value="notifications">
                  <Bell className="mr-2 h-4 w-4" />
                  Notifications
                </TabsTrigger>
                {userRole === "admin" && (
                  <TabsTrigger value="admin">
                    <Shield className="mr-2 h-4 w-4" />
                    Admin
                  </TabsTrigger>
                )}
                {userRole === "scholar" && (
                  <TabsTrigger value="scholar">
                    <GraduationCap className="mr-2 h-4 w-4" />
                    Scholar
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Update your personal information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Full Name</Label>
                      <Input
                        id="displayName"
                        name="displayName"
                        value={profile.displayName}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" value={profile.email} disabled />
                      <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Input
                        id="bio"
                        name="bio"
                        value={profile.bio}
                        onChange={handleInputChange}
                        placeholder="Tell us about yourself"
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          name="location"
                          value={profile.location}
                          onChange={handleInputChange}
                          placeholder="City, Country"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          name="website"
                          value={profile.website}
                          onChange={handleInputChange}
                          placeholder="https://example.com"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <Input
                        id="phoneNumber"
                        name="phoneNumber"
                        value={profile.phoneNumber}
                        onChange={handleInputChange}
                        placeholder="+1234567890"
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={handleUpdateProfile} disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="security">
                <Card>
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                    <CardDescription>Manage your account security</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <div className="flex items-center justify-between rounded-md border p-3">
                        <div>
                          <p className="font-medium">Change Password</p>
                          <p className="text-sm text-muted-foreground">Update your password</p>
                        </div>
                        <Button variant="outline" onClick={() => router.push("/auth/forgot-password")}>
                          Change
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notifications">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Settings</CardTitle>
                    <CardDescription>Manage how you receive notifications</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between space-x-2">
                      <Label htmlFor="emailNotifications" className="flex flex-col space-y-1">
                        <span>Email Notifications</span>
                        <span className="font-normal text-sm text-muted-foreground">
                          Receive notifications via email
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
                        <span>Push Notifications</span>
                        <span className="font-normal text-sm text-muted-foreground">
                          Receive notifications in the browser
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
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              {userRole === "admin" && (
                <TabsContent value="admin">
                  <Card>
                    <CardHeader>
                      <CardTitle>Admin Settings</CardTitle>
                      <CardDescription>Manage admin-specific settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button variant="default" onClick={() => router.push("/admin/dashboard")} className="w-full">
                          <Shield className="mr-2 h-4 w-4" />
                          Admin Dashboard
                        </Button>
                        <Button variant="outline" onClick={() => router.push("/admin/questions")} className="w-full">
                          Manage Questions
                        </Button>
                        <Button variant="outline" onClick={() => router.push("/admin/users")} className="w-full">
                          Manage Users
                        </Button>
                        <Button variant="outline" onClick={() => router.push("/admin/categories")} className="w-full">
                          Manage Categories
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
                      <CardTitle>Scholar Settings</CardTitle>
                      <CardDescription>Manage scholar-specific settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button
                          variant="default"
                          onClick={() => router.push("/scholar/dashboard")}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          <GraduationCap className="mr-2 h-4 w-4" />
                          Scholar Dashboard
                        </Button>
                        <Button variant="outline" onClick={() => router.push("/scholar/questions")} className="w-full">
                          View Assigned Questions
                        </Button>
                        <Button variant="outline" onClick={() => router.push("/scholar/answered")} className="w-full">
                          View Answered Questions
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
