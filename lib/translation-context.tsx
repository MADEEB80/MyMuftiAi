"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useLanguage } from "./language-context"
import enTranslations from "../translations/en.json"
import urTranslations from "../translations/ur.json"

// Define the translation context type
interface TranslationContextType {
  t: (key: string, options?: Record<string, any>) => string
  language: string
}

// Create the context
const TranslationContext = createContext<TranslationContextType>({
  t: (key) => key,
  language: "en",
})

// Define the provider props
interface TranslationProviderProps {
  children: ReactNode
}

// Translation provider component
export function TranslationProvider({ children }: TranslationProviderProps) {
  const { language } = useLanguage()
  const [translations, setTranslations] = useState(language === "ur" ? urTranslations : enTranslations)

  useEffect(() => {
    setTranslations(language === "ur" ? urTranslations : enTranslations)
  }, [language])

  // Translation function
  const t = (key: string, options?: Record<string, any>): string => {
    // Split the key by dots to access nested properties
    const keys = key.split(".")

    // Traverse the translations object
    let result: any = translations
    for (const k of keys) {
      if (result && result[k]) {
        result = result[k]
      } else {
        console.warn(`Translation key not found: ${key}`)
        return key // Return the key if translation not found
      }
    }

    // If the result is not a string, return the key
    if (typeof result !== "string") {
      return key
    }

    // Replace placeholders with values from options
    if (options) {
      return result.replace(/\{(\w+)\}/g, (_, placeholder) => {
        return options[placeholder] !== undefined ? options[placeholder] : `{${placeholder}}`
      })
    }

    return result
  }

  return <TranslationContext.Provider value={{ t, language }}>{children}</TranslationContext.Provider>
}

// Custom hook to use the translation context
export function useTranslation() {
  const context = useContext(TranslationContext)
  if (!context) {
    throw new Error("useTranslation must be used within a TranslationProvider")
  }
  return context
}