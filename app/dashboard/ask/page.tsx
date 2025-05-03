"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { createQuestion } from "@/lib/question-service"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { getAllCategories, type Category } from "@/lib/category-service"
import { useEffect } from "react"
import { useLanguage } from "@/lib/language-context"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export default function AskQuestionPage() {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [categories, setCategories] = useState<Category[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { language } = useLanguage()
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
          title: language === "en" ? "Error" : "خطأ",
          description:
            language === "en"
              ? "Failed to load categories. Please try again."
              : "فشل في تحميل الفئات. يرجى المحاولة مرة أخرى.",
          variant: "destructive",
        })
      }
    }

    fetchCategories()
  }, [language, toast, categoryId])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: language === "en" ? "Error" : "خطأ",
        description:
          language === "en" ? "You must be logged in to ask a question." : "يجب أن تكون مسجلا للدخول لطرح سؤال.",
        variant: "destructive",
      })
      return
    }

    if (!title || !content || !categoryId) {
      toast({
        title: language === "en" ? "Error" : "خطأ",
        description: language === "en" ? "Please fill in all fields." : "يرجى ملء جميع الحقول.",
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
        userName: user.displayName || "Anonymous",
        categoryId,
        status: "pending",
        language: selectedLanguage,
      })

      toast({
        title: language === "en" ? "Success" : "نجاح",
        description: language === "en" ? "Your question has been submitted for review." : "تم تقديم سؤالك للمراجعة.",
      })

      router.push("/dashboard")
    } catch (error) {
      console.error("Error submitting question:", error)
      toast({
        title: language === "en" ? "Error" : "خطأ",
        description:
          language === "en"
            ? "Failed to submit question. Please try again."
            : "فشل في تقديم السؤال. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const pageTitle = language === "en" ? "Ask a Question" : "اطرح سؤالاً"
  const pageDescription =
    language === "en"
      ? "Submit your question to be answered by our scholars."
      : "قدم سؤالك ليتم الإجابة عليه من قبل علمائنا."
  const titleLabel = language === "en" ? "Title" : "العنوان"
  const titlePlaceholder = language === "en" ? "Enter the title of your question" : "أدخل عنوان سؤالك"
  const contentLabel = language === "en" ? "Question" : "السؤال"
  const contentPlaceholder = language === "en" ? "Enter your question in detail" : "أدخل سؤالك بالتفصيل"
  const categoryLabel = language === "en" ? "Category" : "الفئة"
  const languageLabel = language === "en" ? "Language" : "اللغة"
  const submitButton = language === "en" ? "Submit Question" : "إرسال السؤال"
  const submittingButton = language === "en" ? "Submitting..." : "جاري الإرسال..."

  return (
    <div className="container max-w-2xl py-10">
      <Card>
        <CardHeader>
          <CardTitle>{pageTitle}</CardTitle>
          <CardDescription>{pageDescription}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">{titleLabel}</Label>
              <Input
                id="title"
                placeholder={titlePlaceholder}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">{contentLabel}</Label>
              <Textarea
                id="content"
                placeholder={contentPlaceholder}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">{categoryLabel}</Label>
              <Select value={categoryId} onValueChange={setCategoryId} required>
                <SelectTrigger>
                  <SelectValue placeholder={language === "en" ? "Select a category" : "اختر فئة"} />
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
              <Label>{languageLabel}</Label>
              <RadioGroup value={selectedLanguage} onValueChange={setSelectedLanguage} className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="en" id="en" />
                  <Label htmlFor="en">English</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ur" id="ur" />
                  <Label htmlFor="ur">اردو</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? submittingButton : submitButton}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
