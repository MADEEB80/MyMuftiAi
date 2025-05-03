"use client"

import { Suspense } from "react"
import Link from "next/link"
import { RecentQuestions } from "@/components/recent-questions"
import { CategoryBrowser } from "@/components/category-browser"
import { useTranslation } from "@/lib/translation-context"
import { useLanguage } from "@/lib/language-context"

export default function Home() {
  return <HomeContent />
}

// Client component to use hooks
function HomeContent() {
  const { t } = useTranslation()
  const { isRTL } = useLanguage()

  return (
    <main className={`container mx-auto px-4 py-8 ${isRTL ? "rtl" : "ltr"}`}>
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4">{t("home.hero.title")}</h1>
        <p className="text-xl mb-6">{t("home.hero.subtitle")}</p>
        <div className="flex justify-center gap-4">
          <Link
            href="/dashboard/ask"
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
          >
            {t("home.hero.askButton")}
          </Link>
          <Link
            href="/categories"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-lg transition-colors"
          >
            {t("home.hero.browseButton")}
          </Link>
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-8">
        <section>
          <h2 className="text-2xl font-bold mb-4">{t("home.recentAnswers")}</h2>
          <Suspense fallback={<div>{t("common.loading")}</div>}>
            <RecentQuestions />
          </Suspense>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">{t("home.categories.title")}</h2>
          <Suspense fallback={<div>{t("common.loading")}</div>}>
            <CategoryBrowser />
          </Suspense>
        </section>
      </div>
    </main>
  )
}
