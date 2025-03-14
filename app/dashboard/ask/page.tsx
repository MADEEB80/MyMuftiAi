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
import { AlertCircle, Loader2, Save } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

const categories = [
  { value: "prayers", label: "Prayers (Salah)" },
  { value: "fasting", label: "Fasting (Sawm)" },
  { value: "zakat", label: "Charity (Zakat)" },
  { value: "hajj", label: "Pilgrimage (Hajj)" },
  { value: "business", label: "Business & Finance" },
  { value: "family", label: "Family & Relationships" },
  { value: "general", label: "General Questions" },
]

export default function AskQuestionPage() {
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [question, setQuestion] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDraft, setIsDraft] = useState(false)
  const router = useRouter()
  const { user } = useAuth()

  const handleSubmit = async (e: React.FormEvent, saveAsDraft = false) => {
    e.preventDefault()
    setError("")
    setSuccess(false)
    setIsLoading(true)

    if (!user) {
      setError("You must be logged in to submit a question")
      setIsLoading(false)
      return
    }

    try {
      await addDoc(collection(db, "questions"), {
        title,
        category,
        question,
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName,
        status: saveAsDraft ? "draft" : "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      setSuccess(true)

      // Reset form after successful submission
      if (!saveAsDraft) {
        setTitle("")
        setCategory("")
        setQuestion("")

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      }
    } catch (error: any) {
      setError(error.message || "Failed to submit question")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveAsDraft = (e: React.FormEvent) => {
    setIsDraft(true)
    handleSubmit(e, true)
  }

  return (
    <div className="container py-10">
      <Card className="mx-auto max-w-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Ask a Question</CardTitle>
          <CardDescription>Submit your Islamic question to be answered by certified scholars</CardDescription>
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
                  {isDraft
                    ? "Your question has been saved as a draft."
                    : "Your question has been submitted successfully and is awaiting review."}
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="title">Question Title</Label>
              <Input
                id="title"
                placeholder="Brief title for your question"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="question">Your Question</Label>
              <Textarea
                id="question"
                placeholder="Please provide details of your question..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="min-h-[200px]"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={handleSaveAsDraft} disabled={isLoading || success}>
              {isLoading && isDraft ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save as Draft
                </>
              )}
            </Button>
            <Button type="submit" disabled={isLoading || success}>
              {isLoading && !isDraft ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Question"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

