"use client"

import type React from "react"

import { useEffect } from "react"
import { useLanguage } from "@/lib/language-context"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { language, isRTL } = useLanguage()

  // Update document direction based on language
  useEffect(() => {
    document.documentElement.dir = isRTL ? "rtl" : "ltr"
    document.documentElement.lang = language
  }, [language, isRTL])

  return <>{children}</>
}
