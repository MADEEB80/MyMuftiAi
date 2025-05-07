"use client"

import Link from "next/link"
import { useTranslation } from "@/lib/translation-context"
import { Facebook, Twitter, Instagram } from "lucide-react"

// Note: This component must be used within a TranslationProvider
// to access translations from en.json and ur.json
export function Footer() {
  const { t, language } = useTranslation()

  const currentYear = new Date().getFullYear()

  // Footer links organized by section
  const footerLinks = {
    platform: [
      { href: "/", label: t("footer.home") },
      { href: "/categories", label: t("footer.categories") },
      { href: "/search", label: t("footer.search") },
      { href: "/dashboard/ask", label: t("footer.askQuestion") },
    ],
    resources: [
      { href: "/about", label: t("footer.about") },
      { href: "/faq", label: t("footer.faq") },
      { href: "/contact", label: t("footer.contact") },
      { href: "/terms", label: t("footer.terms") },
    ],
    legal: [
      { href: "/privacy", label: t("footer.privacy") },
      { href: "/terms", label: t("footer.terms") },
      { href: "/cookies", label: t("footer.cookies") },
    ],
  }

  // Social media links
  const socialLinks = [
    { href: "https://facebook.com", icon: <Facebook className="h-5 w-5" />, label: "Facebook" },
    { href: "https://twitter.com", icon: <Twitter className="h-5 w-5" />, label: "Twitter" },
    { href: "https://instagram.com", icon: <Instagram className="h-5 w-5" />, label: "Instagram" },
  ]

  return (
    <footer className={`bg-gray-50 border-t ${language === "ur" ? "rtl" : "ltr"}`}>
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand and Description */}
          <div>
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-green-600">MyMufti</span>
              <span className="text-xl font-bold text-gray-700">.com</span>
            </Link>
            <p className="mt-4 text-gray-600 max-w-xs">{t("footer.description")}</p>
            <div className="mt-6 flex space-x-4">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-green-600 transition-colors"
                  aria-label={link.label}
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-800">{t("footer.platformTitle")}</h3>
            <ul className="space-y-2">
              {footerLinks.platform.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-600 hover:text-green-600 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-800">{t("footer.resourcesTitle")}</h3>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-600 hover:text-green-600 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-800">{t("footer.legalTitle")}</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-600 hover:text-green-600 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-center text-gray-600">
            © {currentYear} MyMufti.com. {t("footer.allRightsReserved")}
          </p>
        </div>
      </div>
    </footer>
  )
}