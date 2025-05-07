"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { createQuestion } from "@/lib/question-service"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { getAllCategories, type Category } from "@/lib/category-service"
import { useEffect } from "react"
import { useTranslation } from "@/lib/translation-context"
import { useLanguage } from "@/lib/language-context"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

// Note: This component must be used within LanguageProvider and TranslationProvider
// to access translations from en.json and ur.json
export default function AskQuestionPage() {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [categories, setCategories] = useState<Category[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useTranslation()
  const { language, isRTL } = useLanguage()
  const [selectedLanguage, setSelectedLanguage] = useState(language)

  useEffect(() => {
    async function fetchCategories() {
      try {
        const allCategories = await getAllCategories()
        setCategories(allCategories)
        if (allCategories.length > 0 && !categoryId) {
          setCategoryId(allCategories[0].id || "")
        }
      } catch (error) {
        console.error("Error fetching categories:", error)
        toast({
          title: t("common.error"),
          description: t("askQuestion.errorLoadingCategories"),
          variant: "destructive",
        })
      }
    }

    fetchCategories()
  }, [t, toast, categoryId])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: t("common.error"),
        description: t("askQuestion.errorNotLoggedIn"),
        variant: "destructive",
      })
      return
    }

    if (!title || !content || !categoryId) {
      toast({
        title: t("common.error"),
        description: t("askQuestion.errorIncompleteFields"),
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      await createQuestion({
        title,
        content,
        userId: user.uid,
        userName: user.displayName || t("askQuestion.anonymous"),
        categoryId,
        status: "pending",
        language: selectedLanguage,
      })

      toast({
        title: t("common.success"),
        description: t("askQuestion.successMessage"),
      })

      router.push("/dashboard")
    } catch (error) {
      console.error("Error submitting question:", error)
      toast({
        title: t("common.error"),
        description: t("askQuestion.errorSubmitting"),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container max-w-2xl py-10" dir={isRTL ? "rtl" : "ltr"}>
      <Card>
        <CardHeader>
          <CardTitle>{t("askQuestion.title")}</CardTitle>
          <CardDescription>{t("askQuestion.description")}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t("askQuestion.titleLabel")}</Label>
              <Input
                id="title"
                placeholder={t("askQuestion.titlePlaceholder")}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">{t("askQuestion.contentLabel")}</Label>
              <Textarea
                id="content"
                placeholder={t("askQuestion.contentPlaceholder")}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">{t("askQuestion.categoryLabel")}</Label>
              <Select value={categoryId} onValueChange={setCategoryId} required>
                <SelectTrigger>
                  <SelectValue placeholder={t("askQuestion.categoryPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id || ""}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("askQuestion.languageLabel")}</Label>
              <RadioGroup value={selectedLanguage} onValueChange={setSelectedLanguage} className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="en" id="en" />
                  <Label htmlFor="en">{t("common.english")}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ur" id="ur" />
                  <Label htmlFor="ur">{t("common.urdu")}</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("askQuestion.submittingButton") : t("askQuestion.submitButton")}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}