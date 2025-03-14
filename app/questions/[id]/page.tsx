"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowLeft } from "lucide-react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface QuestionData {
  id: string
  title: string
  category: string
  question: string
  answer: string
  createdAt: Date
  userName: string
  scholarName?: string
}

export default function QuestionDetailPage({ params }: { params: { id: string } }) {
  const [question, setQuestion] = useState<QuestionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const docRef = doc(db, "questions", params.id)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data()
          setQuestion({
            id: docSnap.id,
            title: data.title,
            category: data.category,
            question: data.question,
            answer: data.answer || "This question is still awaiting an answer.",
            createdAt: data.createdAt?.toDate() || new Date(),
            userName: data.userName || "Anonymous",
            scholarName: data.scholarName,
          })
        } else {
          setError("Question not found")
        }
      } catch (error) {
        console.error("Error fetching question:", error)
        setError("Failed to load question")
      } finally {
        setLoading(false)
      }
    }

    fetchQuestion()
  }, [params.id])

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date)
  }

  if (loading) {
    return (
      <div className="container flex h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !question) {
    return (
      <div className="container py-10">
        <Card className="mx-auto max-w-3xl">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/search">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Search
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/search">
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Search
          </Button>
        </Link>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{question.title}</CardTitle>
                <CardDescription className="mt-2">
                  Asked by {question.userName} on {formatDate(question.createdAt)}
                </CardDescription>
              </div>
              <Badge>{question.category.charAt(0).toUpperCase() + question.category.slice(1)}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="mb-2 font-semibold">Question:</h3>
              <div className="rounded-md bg-muted p-4">
                <p className="whitespace-pre-line">{question.question}</p>
              </div>
            </div>

            <div>
              <h3 className="mb-2 font-semibold">Answer:</h3>
              <div className="rounded-md border p-4">
                <p className="whitespace-pre-line">{question.answer}</p>
                {question.scholarName && (
                  <p className="mt-4 text-sm text-muted-foreground">Answered by: {question.scholarName}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <h3 className="mb-4 text-lg font-medium">Have a similar question?</h3>
          <Link href="/dashboard/ask">
            <Button>Ask Your Own Question</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

