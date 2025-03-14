"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Globe } from "lucide-react"

type Language = {
  code: string
  name: string
  dir: "ltr" | "rtl"
}

const languages: Language[] = [
  { code: "en", name: "English", dir: "ltr" },
  { code: "ar", name: "العربية", dir: "rtl" },
  { code: "ur", name: "اردو", dir: "rtl" },
]

export default function LanguageSwitcher() {
  const [currentLang, setCurrentLang] = useState<Language>(languages[0])

  useEffect(() => {
    // Set initial language based on HTML dir attribute
    const htmlDir = document.documentElement.dir
    const initialLang = languages.find((lang) => lang.dir === htmlDir) || languages[0]
    setCurrentLang(initialLang)
  }, [])

  const handleLanguageChange = (lang: Language) => {
    // Update HTML dir attribute
    document.documentElement.dir = lang.dir
    document.documentElement.lang = lang.code

    // Update state
    setCurrentLang(lang)

    // You could also store this preference in localStorage
    localStorage.setItem("preferredLanguage", lang.code)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Globe className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            className={`cursor-pointer ${currentLang.code === lang.code ? "font-bold" : ""}`}
            onClick={() => handleLanguageChange(lang)}
          >
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

