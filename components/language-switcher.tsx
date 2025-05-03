"use client"

import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"
import { Globe } from "lucide-react"
import { useCallback } from "react"

// Language switcher component that toggles between English and Urdu
export default function LanguageSwitcher() {
  const { language, setLanguage, isRTL } = useLanguage()

  // Toggle language between English and Urdu
  const toggleLanguage = useCallback(() => {
    setLanguage(language === "en" ? "ur" : "en")
  }, [language, setLanguage])

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="flex items-center gap-1"
      title={language === "en" ? "Switch to Urdu" : "انگریزی میں تبدیل کریں"}
    >
      <Globe className="h-4 w-4" />
      <span>{language === "en" ? "اردو" : "English"}</span>
    </Button>
  )
}
