"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { getQuestionsByUserIdAndLanguage } from "@/lib/question-service"
import { useLanguage } from "@/lib/language-context"
import { useTranslation } from "@/lib/translation-context"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { User, BookOpen, Settings } from "lucide-react"

interface UserQuestion {
  id?: string
  title: string
  content: string
  status: "pending" | "approved" | "rejected" | "answered"
  createdAt: Date
  language: string
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [questions, setQuestions] = useState<UserQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const { language } = useLanguage()
  const { t } = useTranslation()

  useEffect(() => {
    async function fetchUserQuestions() {
      if (!user) return

      setLoading(true)
      try {
        const userQuestions = await getQuestionsByUserIdAndLanguage(user.uid, language)
        setQuestions(userQuestions)
      } catch (error) {
        console.error("Error fetching user questions:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserQuestions()
  }, [user, language])

  if (!user) {
    return (
      <div className="container py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">{t("auth.login")}</h1>
        <p className="mb-6">
          {language === "en"
            ? "You need to be logged in to view your dashboard."
            : "آپ کو اپنا ڈیش بورڈ دیکھنے کے لیے لاگ ان ہونا ضروری ہے۔"}
        </p>
        <Link href="/auth/login">
          <Button>{t("auth.login")}</Button>
        </Link>
      </div>
    )
  }

  // Role-specific quick links
  const getRoleQuickLinks = () => {
    if (user.role === "admin") {
      return [
        {
          title: language === "en" ? "Admin Panel" : "ایڈمن پینل",
          description:
            language === "en" ? "Access admin controls and settings" : "ایڈمن کنٹرولز اور ترتیبات تک رسائی حاصل کریں",
          icon: <Settings className="h-8 w-8 text-blue-500" />,
          href: "/admin",
        },
        {
          title: language === "en" ? "Manage Users" : "صارفین کا انتظام کریں",
          description: language === "en" ? "View and manage user accounts" : "صارف اکاؤنٹس دیکھیں اور انتظام کریں",
          icon: <User className="h-8 w-8 text-green-500" />,
          href: "/admin/users",
        },
        {
          title: language === "en" ? "Manage Categories" : "زمرہ جات کا انتظام کریں",
          description:
            language === "en" ? "Create and edit question categories" : "سوال کے زمرہ جات بنائیں اور ترمیم کریں",
          icon: <BookOpen className="h-8 w-8 text-purple-500" />,
          href: "/admin/categories",
        },
      ]
    } else if (user.role === "scholar") {
      return [
        {
          title: language === "en" ? "Scholar Panel" : "عالم پینل",
          description:
            language === "en" ? "Access scholar tools and questions" : "عالم کے ٹولز اور سوالات تک رسائی حاصل کریں",
          icon: <BookOpen className="h-8 w-8 text-blue-500" />,
          href: "/scholar",
        },
        {
          title: language === "en" ? "Answer Questions" : "سوالات کے جوابات دیں",
          description:
            language === "en" ? "View and answer pending questions" : "زیر التواء سوالات دیکھیں اور جواب دیں",
          icon: <BookOpen className="h-8 w-8 text-green-500" />,
          href: "/scholar/questions",
        },
      ]
    }
    return []
  }

  const roleLinks = getRoleQuickLinks()

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t("nav.dashboard")}</h1>
          <p className="text-gray-500">
            {language === "en" ? `Welcome, ${user.displayName || "User"}` : `مرحبًا، ${user.displayName || "صارف"}`}
          </p>
          <Badge className="mt-2" variant="outline">
            {user.role === "admin"
              ? language === "en"
                ? "Admin"
                : "ایڈمن"
              : user.role === "scholar"
                ? language === "en"
                  ? "Scholar"
                  : "عالم"
                : language === "en"
                  ? "User"
                  : "صارف"}
          </Badge>
        </div>
        <Link href="/dashboard/ask">
          <Button>{language === "en" ? "Ask a Question" : "سوال پوچھیں"}</Button>
        </Link>
      </div>

      {/* Role-specific quick links */}
      {roleLinks.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">{language === "en" ? "Quick Links" : "فوری لنکس"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {roleLinks.map((link, index) => (
              <Link href={link.href} key={index}>
                <Card className="h-full transition-all hover:shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-lg">
                      {link.icon}
                      <span className="ml-2">{link.title}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">{link.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      <h2 className="text-xl font-semibold mb-4">{language === "en" ? "My Questions" : "میرے سوالات"}</h2>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">{language === "en" ? "All" : "تمام"}</TabsTrigger>
          <TabsTrigger value="pending">{language === "en" ? "Pending" : "زیر التواء"}</TabsTrigger>
          <TabsTrigger value="answered">{language === "en" ? "Answered" : "جواب دیا گیا"}</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {renderQuestions(questions, "all")}
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          {renderQuestions(
            questions.filter((q) => q.status !== "answered"),
            "pending",
          )}
        </TabsContent>

        <TabsContent value="answered" className="mt-6">
          {renderQuestions(
            questions.filter((q) => q.status === "answered"),
            "answered",
          )}
        </TabsContent>
      </Tabs>
    </div>
  )

  function renderQuestions(questionsToRender: UserQuestion[], tab: string) {
    if (loading) {
      return (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )
    }

    if (questionsToRender.length === 0) {
      return (
        <div className="text-center py-10">
          <p className="text-gray-500 mb-4">
            {language === "en" ? "You haven't asked any questions yet." : "آپ نے ابھی تک کوئی سوال نہیں پوچھا ہے۔"}
          </p>
          {tab === "all" && (
            <Link href="/dashboard/ask">
              <Button>{language === "en" ? "Ask a Question" : "سوال پوچھیں"}</Button>
            </Link>
          )}
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {questionsToRender.map((question) => (
          <Card key={question.id}>
            <CardHeader>
              <CardTitle>{question.title}</CardTitle>
              <CardDescription>
                {new Date(question.createdAt).toLocaleDateString(language === "en" ? "en-US" : "ar-SA", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="line-clamp-2">{question.content}</p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Badge variant={question.status === "answered" ? "default" : "outline"}>
                {question.status === "pending" && (language === "en" ? "Pending" : "زیر التواء")}
                {question.status === "approved" && (language === "en" ? "Approved" : "منظور شدہ")}
                {question.status === "rejected" && (language === "en" ? "Rejected" : "مسترد")}
                {question.status === "answered" && (language === "en" ? "Answered" : "جواب دیا گیا")}
              </Badge>
              <Link href={`/questions/${question.id}`}>
                <Button variant="outline" size="sm">
                  {language === "en" ? "View Question" : "سوال دیکھیں"}
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }
}
