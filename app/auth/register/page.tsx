"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Check, Loader2, X } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/translation-context"
import { useLanguage } from "@/lib/language-context"

// Note: This component must be used within LanguageProvider and TranslationProvider
// to access translations from en.json and ur.json
export default function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { signUp } = useAuth()
  const { t } = useTranslation()
  const { isRTL } = useLanguage()

  // Password strength validation
  const hasMinLength = password.length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)

  const isPasswordStrong = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!isPasswordStrong) {
      setError(t("auth.passwordNotStrong"))
      return
    }

    setIsLoading(true)

    try {
      await signUp(email, password, name)
      router.push("/dashboard")
    } catch (error: any) {
      setError(error.message || t("auth.signUpError"))
    } finally {
      setIsLoading(false)
    }
  }

  const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => (
    <div className="flex items-center gap-2">
      {met ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}
      <span className={met ? "text-green-500" : "text-muted-foreground"}>{text}</span>
    </div>
  )

  return (
    <div className="container flex h-screen items-center justify-center" dir={isRTL ? "rtl" : "ltr"}>
      <Card className="mx-auto w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">{t("auth.signUpTitle")}</CardTitle>
          <CardDescription>{t("auth.signUpDescription")}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">{t("auth.fullNameLabel")}</Label>
              <Input
                id="name"
                placeholder={t("auth.fullNamePlaceholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.emailLabel")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("auth.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.passwordLabel")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div className="mt-2 space-y-1 text-xs">
                <PasswordRequirement met={hasMinLength} text={t("auth.passwordMinLength")} />
                <PasswordRequirement met={hasUppercase} text={t("auth.passwordUppercase")} />
                <PasswordRequirement met={hasLowercase} text={t("auth.passwordLowercase")} />
                <PasswordRequirement met={hasNumber} text={t("auth.passwordNumber")} />
                <PasswordRequirement met={hasSpecialChar} text={t("auth.passwordSpecialChar")} />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading || !isPasswordStrong}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("auth.creatingAccount")}
                </>
              ) : (
                t("auth.createAccount")
              )}
            </Button>
            <div className="text-center text-sm">
              {t("auth.hasAccount")}{" "}
              <Link href="/auth/login" className="font-medium text-primary underline-offset-4 hover:underline">
                {t("auth.signInLink")}
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}