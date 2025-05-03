"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import NotificationBell from "@/components/notification-bell"
import LanguageSwitcher from "@/components/language-switcher"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/translation-context"
import { useLanguage } from "@/lib/language-context"
import { Menu, X, Home, User, LogOut, Settings, Shield, GraduationCap } from "lucide-react"
import { cn } from "@/lib/utils"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useTranslation()
  const { language, isRTL } = useLanguage()

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true
    if (path !== "/" && pathname.startsWith(path)) return true
    return false
  }

  // Determine user role
  const userRole = user?.role || "user"

  return (
    <header className={`sticky top-0 z-50 w-full border-b bg-white ${isRTL ? "rtl" : "ltr"}`}>
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold text-green-600">{language === "ur" ? "میرا مفتی" : "MyMufti"}</span>
            <span className="text-xl font-bold text-gray-700">.com</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className={cn(
              "text-sm font-medium transition-colors hover:text-green-600",
              isActive("/") ? "text-green-600" : "text-gray-600",
            )}
          >
            {t("nav.home")}
          </Link>
          <Link
            href="/categories"
            className={cn(
              "text-sm font-medium transition-colors hover:text-green-600",
              isActive("/categories") ? "text-green-600" : "text-gray-600",
            )}
          >
            {t("nav.categories")}
          </Link>
          <Link
            href="/search"
            className={cn(
              "text-sm font-medium transition-colors hover:text-green-600",
              isActive("/search") ? "text-green-600" : "text-gray-600",
            )}
          >
            {t("nav.search")}
          </Link>
          <Link
            href="/dashboard/ask"
            className={cn(
              "text-sm font-medium transition-colors hover:text-green-600",
              isActive("/dashboard/ask") ? "text-green-600" : "text-gray-600",
            )}
          >
            {t("nav.askQuestion")}
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <LanguageSwitcher />

          {user ? (
            <>
              {/* Notification Bell */}
              <div className="hidden md:block">
                <NotificationBell />
              </div>

              {/* User Menu */}
              <div className="relative">
                <div
                  className="h-8 w-8 rounded-full cursor-pointer overflow-hidden"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL || ""} alt={user.displayName || "User"} />
                    <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                </div>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div
                    className={`absolute ${isRTL ? "left-0" : "right-0"} mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50`}
                  >
                    <div className="py-1">
                      {/* User info */}
                      <div className="px-4 py-2 border-b">
                        <p className="text-sm font-medium">{user.displayName || "User"}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>

                      {/* Menu items */}
                      <Link
                        href="/dashboard"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Home className={`${isRTL ? "ml-2" : "mr-2"} h-4 w-4`} />
                        {t("nav.dashboard")}
                      </Link>

                      <Link
                        href="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <User className={`${isRTL ? "ml-2" : "mr-2"} h-4 w-4`} />
                        {t("nav.profile")}
                      </Link>

                      {/* Admin Panel Link */}
                      {userRole === "admin" && (
                        <Link
                          href="/admin/dashboard"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <Shield className={`${isRTL ? "ml-2" : "mr-2"} h-4 w-4`} />
                          {t("nav.adminPanel")}
                        </Link>
                      )}

                      {/* Scholar Panel Link */}
                      {userRole === "scholar" && (
                        <Link
                          href="/scholar/dashboard"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <GraduationCap className={`${isRTL ? "ml-2" : "mr-2"} h-4 w-4`} />
                          {t("nav.scholarPanel")}
                        </Link>
                      )}

                      <Link
                        href="/profile/edit"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Settings className={`${isRTL ? "ml-2" : "mr-2"} h-4 w-4`} />
                        {t("nav.settings")}
                      </Link>

                      {/* Logout */}
                      <div className="border-t border-gray-100 mt-1">
                        <button
                          onClick={() => {
                            setIsMenuOpen(false)
                            handleSignOut()
                          }}
                          className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <LogOut className={`${isRTL ? "ml-2" : "mr-2"} h-4 w-4`} />
                          {t("auth.logout")}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button asChild variant="ghost">
                <Link href="/auth/login">{t("auth.login")}</Link>
              </Button>
              <Button asChild className="bg-green-600 hover:bg-green-700">
                <Link href="/auth/register">{t("auth.register")}</Link>
              </Button>
            </div>
          )}

          {/* Mobile menu button */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className={`space-y-1 px-4 pb-3 pt-2 ${isRTL ? "rtl" : "ltr"}`}>
            <Link
              href="/"
              className={cn(
                "flex items-center py-2 text-base font-medium",
                isActive("/") ? "text-green-600" : "text-gray-600 hover:text-green-600",
              )}
              onClick={() => setIsMenuOpen(false)}
            >
              <Home className={`${isRTL ? "ml-2" : "mr-2"} h-4 w-4`} />
              {t("nav.home")}
            </Link>

            <Link
              href="/categories"
              className={cn(
                "flex items-center py-2 text-base font-medium",
                isActive("/categories") ? "text-green-600" : "text-gray-600 hover:text-green-600",
              )}
              onClick={() => setIsMenuOpen(false)}
            >
              {t("nav.categories")}
            </Link>

            <Link
              href="/search"
              className={cn(
                "flex items-center py-2 text-base font-medium",
                isActive("/search") ? "text-green-600" : "text-gray-600 hover:text-green-600",
              )}
              onClick={() => setIsMenuOpen(false)}
            >
              {t("nav.search")}
            </Link>

            <Link
              href="/dashboard/ask"
              className={cn(
                "flex items-center py-2 text-base font-medium",
                isActive("/dashboard/ask") ? "text-green-600" : "text-gray-600 hover:text-green-600",
              )}
              onClick={() => setIsMenuOpen(false)}
            >
              {t("nav.askQuestion")}
            </Link>

            {user && (
              <>
                <div className="pt-2 border-t mt-2">
                  <Link
                    href="/dashboard"
                    className="flex items-center py-2 text-base font-medium text-gray-600 hover:text-green-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Home className={`${isRTL ? "ml-2" : "mr-2"} h-4 w-4`} />
                    {t("nav.dashboard")}
                  </Link>

                  <Link
                    href="/profile"
                    className="flex items-center py-2 text-base font-medium text-gray-600 hover:text-green-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className={`${isRTL ? "ml-2" : "mr-2"} h-4 w-4`} />
                    {t("nav.profile")}
                  </Link>

                  {/* Admin Panel Link */}
                  {userRole === "admin" && (
                    <Link
                      href="/admin/dashboard"
                      className="flex items-center py-2 text-base font-medium text-gray-600 hover:text-green-600"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Shield className={`${isRTL ? "ml-2" : "mr-2"} h-4 w-4`} />
                      {t("nav.adminPanel")}
                    </Link>
                  )}

                  {/* Scholar Panel Link */}
                  {userRole === "scholar" && (
                    <Link
                      href="/scholar/dashboard"
                      className="flex items-center py-2 text-base font-medium text-gray-600 hover:text-green-600"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <GraduationCap className={`${isRTL ? "ml-2" : "mr-2"} h-4 w-4`} />
                      {t("nav.scholarPanel")}
                    </Link>
                  )}
                </div>

                <Button
                  variant="destructive"
                  className="w-full mt-4"
                  onClick={() => {
                    handleSignOut()
                    setIsMenuOpen(false)
                  }}
                >
                  <LogOut className={`${isRTL ? "ml-2" : "mr-2"} h-4 w-4`} />
                  {t("auth.logout")}
                </Button>
              </>
            )}

            {!user && (
              <div className="pt-4 flex flex-col space-y-2">
                <Button asChild variant="outline">
                  <Link href="/auth/login" onClick={() => setIsMenuOpen(false)}>
                    {t("auth.login")}
                  </Link>
                </Button>
                <Button asChild className="bg-green-600 hover:bg-green-700">
                  <Link href="/auth/register" onClick={() => setIsMenuOpen(false)}>
                    {t("auth.register")}
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
