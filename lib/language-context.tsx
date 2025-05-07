"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useMemo } from "react"

// Define the available languages
export type Language = "en" | "ur"

// Define the context type
interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  isRTL: boolean
}

// Create the context with default values
const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  isRTL: false,
})

// Custom hook to use the language context
export const useLanguage = () => useContext(LanguageContext)

// Provider component
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Get initial language from localStorage if available, otherwise default to English
  const [language, setLanguage] = useState<Language>("en")

  // Determine if the current language is RTL
  const isRTL = useMemo(() => language === "ur", [language])

  // Load saved language preference from localStorage on component mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language
    if (savedLanguage && (savedLanguage === "en" || savedLanguage === "ur")) {
      setLanguage(savedLanguage)
    }
  }, [])

  // Save language preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("language", language)

    // Update the document direction based on language
    document.documentElement.dir = isRTL ? "rtl" : "ltr"
    document.documentElement.lang = language

    // Add or remove RTL class from body
    if (isRTL) {
      document.body.classList.add("rtl")
    } else {
      document.body.classList.remove("rtl")
    }
  }, [language, isRTL])

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      language,
      setLanguage,
      isRTL,
    }),
    [language, isRTL],
  )

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>
}
