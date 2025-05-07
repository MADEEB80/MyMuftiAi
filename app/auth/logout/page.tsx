"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/translation-context"
import { useLanguage } from "@/lib/language-context"

// Note: This component must be used within LanguageProvider and TranslationProvider
// to access translations from en.json and ur.json
export default function LogoutPage() {
  const { signOut } = useAuth()
  const router = useRouter()
  const { t } = useTranslation()
  const { isRTL } = useLanguage()

  useEffect(() => {
    const performLogout = async () => {
      try {
        await signOut()
        router.push("/")
      } catch (error) {
        console.error("Error during logout:", error)
        router.push("/")
      }
    }

    performLogout()
  }, [signOut, router])

  return (
    <div className="flex min-h-screen items-center justify-center" dir={isRTL ? "rtl" : "ltr"}>
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">{t("auth.logoutTitle")}</h1>
        <p>{t("auth.logoutDescription")}</p>
      </div>
    </div>
  )
}