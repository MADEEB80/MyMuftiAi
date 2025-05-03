"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useLanguage } from "./language-context"

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

// English translations
const enTranslations = {
  nav: {
    home: "Home",
    categories: "Categories",
    search: "Search",
    askQuestion: "Ask a Question",
    dashboard: "Dashboard",
    profile: "Profile",
    settings: "Settings",
    adminPanel: "Admin Panel",
    scholarPanel: "Scholar Panel",
  },
  auth: {
    login: "Login",
    register: "Register",
    logout: "Logout",
  },
  home: {
    hero: {
      title: "Ask Islamic Questions, Get Authentic Answers",
      subtitle: "Connect with qualified scholars who can provide guidance based on Islamic teachings",
      askButton: "Ask a Question",
      browseButton: "Browse Questions",
    },
    features: {
      title: "Why Choose MyMufti",
      feature1: {
        title: "Verified Scholars",
        description: "All our scholars are verified and qualified to answer your questions",
      },
      feature2: {
        title: "Authentic Sources",
        description: "Answers are based on authentic Islamic sources and references",
      },
      feature3: {
        title: "Multilingual Support",
        description: "Get answers in English and Urdu languages",
      },
    },
    categories: {
      title: "Browse by Category",
      viewAllButton: "View All Categories",
    },
    cta: {
      title: "Have a Question?",
      subtitle: "Our scholars are ready to provide you with authentic answers",
      button: "Ask Now",
    },
  },
  categories: {
    questionCount: "{count} Questions",
  },
  footer: {
    description:
      "MyMufti.com is a platform connecting Muslims with qualified scholars to get authentic answers to their questions based on Islamic teachings.",
    platformTitle: "Platform",
    home: "Home",
    categories: "Categories",
    search: "Search",
    askQuestion: "Ask a Question",
    resourcesTitle: "Resources",
    about: "About",
    faq: "FAQ",
    contact: "Contact",
    terms: "Terms",
    legalTitle: "Legal",
    privacy: "Privacy",
    cookies: "Cookies",
    allRightsReserved: "All Rights Reserved",
  },
}

// Urdu translations
const urTranslations = {
  nav: {
    home: "ہوم",
    categories: "زمرہ جات",
    search: "تلاش کریں",
    askQuestion: "سوال پوچھیں",
    dashboard: "ڈیش بورڈ",
    profile: "پروفائل",
    settings: "ترتیبات",
    adminPanel: "ایڈمن پینل",
    scholarPanel: "عالم پینل",
  },
  auth: {
    login: "لاگ ان",
    register: "رجسٹر",
    logout: "لاگ آؤٹ",
  },
  home: {
    hero: {
      title: "اسلامی سوالات پوچھیں، صحیح جوابات حاصل کریں",
      subtitle: "قابل علماء سے رابطہ کریں جو اسلامی تعلیمات کی بنیاد پر رہنمائی فراہم کر سکتے ہیں",
      askButton: "سوال پوچھیں",
      browseButton: "سوالات براؤز کریں",
    },
    features: {
      title: "میرا مفتی کو کیوں منتخب کریں",
      feature1: {
        title: "تصدیق شدہ علماء",
        description: "ہمارے تمام علماء تصدیق شدہ ہیں اور آپ کے سوالات کا جواب دینے کے لیے اہل ہیں",
      },
      feature2: {
        title: "صحیح ذرائع",
        description: "جوابات صحیح اسلامی ذرائع اور حوالہ جات پر مبنی ہیں",
      },
      feature3: {
        title: "کثیر لسانی سپورٹ",
        description: "انگریزی اور اردو زبانوں میں جوابات حاصل کریں",
      },
    },
    categories: {
      title: "زمرہ کے مطابق براؤز کریں",
      viewAllButton: "تمام زمرہ جات دیکھیں",
    },
    cta: {
      title: "کوئی سوال ہے؟",
      subtitle: "ہمارے علماء آپ کو صحیح جوابات فراہم کرنے کے لیے تیار ہیں",
      button: "ابھی پوچھیں",
    },
  },
  categories: {
    questionCount: "{count} سوالات",
  },
  footer: {
    description:
      "میرا مفتی ڈاٹ کام ایک ایسا پلیٹ فارم ہے جو مسلمانوں کو قابل علماء سے جوڑتا ہے تاکہ وہ اسلامی تعلیمات کی بنیاد پر اپنے سوالات کے صحیح جوابات حاصل کر سکیں۔",
    platformTitle: "پلیٹ فارم",
    home: "ہوم",
    categories: "زمرہ جات",
    search: "تلاش کریں",
    askQuestion: "سوال پوچھیں",
    resourcesTitle: "وسائل",
    about: "ہمارے بارے میں",
    faq: "اکثر پوچھے گئے سوالات",
    contact: "رابطہ کریں",
    terms: "شرائط",
    legalTitle: "قانونی",
    privacy: "رازداری",
    cookies: "کوکیز",
    allRightsReserved: "جملہ حقوق محفوظ ہیں",
  },
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
