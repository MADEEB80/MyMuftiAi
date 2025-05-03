"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import CategoryBrowser from "@/components/category-browser"
import { useTranslation } from "@/lib/translation-context"
import { useLanguage } from "@/lib/language-context"

export default function Home() {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const isRTL = language === "ur"

  return (
    <main className={`flex min-h-screen flex-col ${isRTL ? "rtl" : "ltr"}`}>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-white to-gray-100 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="mb-6 text-4xl font-bold md:text-5xl lg:text-6xl">{t("home.hero.title")}</h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600">{t("home.hero.subtitle")}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/dashboard/ask">
              <Button size="lg">{t("home.hero.askButton")}</Button>
            </Link>
            <Link href="/categories">
              <Button variant="outline" size="lg">
                {t("home.hero.browseButton")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">{t("home.features.title")}</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>{t("home.features.feature1.title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{t("home.features.feature1.description")}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t("home.features.feature2.title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{t("home.features.feature2.description")}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t("home.features.feature3.title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{t("home.features.feature3.description")}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">{t("home.categories.title")}</h2>
          <CategoryBrowser />
          <div className="mt-10 text-center">
            <Link href="/categories">
              <Button variant="outline">{t("home.categories.viewAllButton")}</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-16 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-6 text-3xl font-bold">{t("home.cta.title")}</h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg">{t("home.cta.subtitle")}</p>
          <Link href="/dashboard/ask">
            <Button variant="secondary" size="lg">
              {t("home.cta.button")}
            </Button>
          </Link>
        </div>
      </section>
    </main>
  )
}
