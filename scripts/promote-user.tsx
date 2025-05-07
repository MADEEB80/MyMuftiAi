"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Check, Loader2 } from "lucide-react"
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"

export default function PromoteUserPage() {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()

  const handlePromoteUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsLoading(true)

    if (!user) {
      setError("You must be logged in as an admin to promote users")
      setIsLoading(false)
      return
    }

    try {
      // First, check if the current user is an admin
      const adminDoc = await getDoc(doc(db, "users", user.uid))
      if (!adminDoc.exists() || adminDoc.data().role !== "admin") {
        setError("You don't have permission to promote users")
        setIsLoading(false)
        return
      }

      // Find the user by email
      const usersCollection = collection(db, "users")
      const q = query(usersCollection, where("email", "==", email))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        setError("User not found with this email")
        setIsLoading(false)
        return
      }

      // Get the first matching user
      const userDoc = querySnapshot.docs[0]

      // Update the user's role
      await updateDoc(doc(db, "users", userDoc.id), {
        role: role,
        updatedAt: new Date(),
      })

      setSuccess(`User ${email} has been promoted to ${role}`)
      setEmail("")
      setRole("")
    } catch (error: any) {
      setError(error.message || "Failed to promote user")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container py-10">
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>Promote User</CardTitle>
          <CardDescription>Change a user's role to admin or scholar</CardDescription>
        </CardHeader>
        <form onSubmit={handlePromoteUser}>
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
              <Label htmlFor="email">User Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">New Role</Label>
              <Select value={role} onValueChange={setRole} required>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="scholar">Scholar</SelectItem>
                  <SelectItem value="user">Regular User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Promote User"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
