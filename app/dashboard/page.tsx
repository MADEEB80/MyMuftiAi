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

// Note: This component must be used within LanguageProvider and TranslationProvider
// to access translations from en.json and ur.json
export default function DashboardPage() {
  const { user } = useAuth()
  const [questions, setQuestions] = useState<UserQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const { language, isRTL } = useLanguage()
  const { t } = useTranslation()
// Add this to debug
console.log("User object:", user);
console.log("User role:", user?.role);
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
      <div className="container py-10 text-center" dir={isRTL ? "rtl" : "ltr"}>
        <h1 className="text-2xl font-bold mb-4">{t("common.authentication_required")}</h1>
        <p className="mb-6">{t("dashboard.notLoggedIn")}</p>
        <Link href="/auth/login">
          <Button>{t("common.sign_in")}</Button>
        </Link>
      </div>
    )
  }

  // Role-specific quick links
  const getRoleQuickLinks = () => {
    if (user.role === "admin") {
      return [
        {
          title: t("dashboard.adminPanel"),
          description: t("dashboard.adminPanelDescription"),
          icon: <Settings className="h-8 w-8 text-blue-500" />,
          href: "/admin",
        },
        {
          title: t("dashboard.manageUsers"),
          description: t("dashboard.manageUsersDescription"),
          icon: <User className="h-8 w-8 text-green-500" />,
          href: "/admin/users",
        },
        {
          title: t("dashboard.manageCategories"),
          description: t("dashboard.manageCategoriesDescription"),
          icon: <BookOpen className="h-8 w-8 text-purple-500" />,
          href: "/admin/categories",
        },
      ]
    } else if (user.role === "scholar") {
      return [
        {
          title: t("dashboard.scholarPanel"),
          description: t("dashboard.scholarPanelDescription"),
          icon: <BookOpen className="h-8 w-8 text-blue-500" />,
          href: "/scholar",
        },
        {
          title: t("dashboard.answerQuestions"),
          description: t("dashboard.answerQuestionsDescription"),
          icon: <BookOpen className="h-8 w-8 text-green-500" />,
          href: "/scholar/questions",
        },
      ]
    }
    return []
  }

  const roleLinks = getRoleQuickLinks()

  return (
    <div className="container py-10" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t("nav.dashboard")}</h1>
          <p className="text-gray-500">{t("dashboard.welcome", { name: user.displayName || t("common.anonymous") })}</p>
          <Badge className="mt-2" variant="outline">
            {t(`dashboard.role_${user.role}`)}
          </Badge>
        </div>
        <Link href="/dashboard/ask">
          <Button>{t("dashboard.askQuestion")}</Button>
        </Link>
      </div>

      {/* Role-specific quick links */}
      {roleLinks.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">{t("dashboard.quickLinks")}</h2>
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

      <h2 className="text-xl font-semibold mb-4">{t("dashboard.myQuestions")}</h2>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">{t("dashboard.tabAll")}</TabsTrigger>
          <TabsTrigger value="pending">{t("dashboard.tabPending")}</TabsTrigger>
          <TabsTrigger value="answered">{t("dashboard.tabAnswered")}</TabsTrigger>
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
          <p className="text-gray-500 mb-4">{t("dashboard.noQuestions")}</p>
          {tab === "all" && (
            <Link href="/dashboard/ask">
              <Button>{t("dashboard.askQuestion")}</Button>
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
                {new Date(question.createdAt).toLocaleDateString(isRTL ? "ur-PK" : "en-US", {
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
                {t(`dashboard.status_${question.status}`)}
              </Badge>
              <Link href={`/questions/${question.id}`}>
                <Button variant="outline" size="sm">
                  {t("dashboard.viewQuestion")}
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }
}