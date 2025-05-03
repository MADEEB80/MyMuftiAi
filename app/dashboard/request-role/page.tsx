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
import type { UserRole } from "@/lib/user-service"

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)
    setIsLoading(true)

    if (!user) {
      setError("You must be logged in to request a role")
      setIsLoading(false)
      return
    }

    if (!requestedRole) {
      setError("Please select a role")
      setIsLoading(false)
      return
    }

    try {
      await addDoc(collection(db, "roleRequests"), {
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName,
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
      setError(error.message || "Failed to submit request")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container py-10">
      <Card className="mx-auto max-w-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Request Special Role</CardTitle>
          <CardDescription>
            Request to become a scholar or admin on MyMufti.com. Your request will be reviewed by our team.
          </CardDescription>
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
                <AlertDescription>
                  Your role request has been submitted successfully and is awaiting review. We will contact you soon.
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="role">Requested Role</Label>
              <Select value={requestedRole} onValueChange={(value) => setRequestedRole(value as UserRole)} required>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scholar">Scholar</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="qualifications">Qualifications</Label>
              <Textarea
                id="qualifications"
                placeholder="List your relevant qualifications and certifications..."
                value={qualifications}
                onChange={(e) => setQualifications(e.target.value)}
                className="min-h-[100px]"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="institution">Institution/University</Label>
              <Input
                id="institution"
                placeholder="Where did you study?"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="experience">Relevant Experience</Label>
              <Textarea
                id="experience"
                placeholder="Describe your relevant experience..."
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
                  Submitting...
                </>
              ) : (
                "Submit Request"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
