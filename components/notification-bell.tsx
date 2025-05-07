"use client"

import { useState, useEffect, useRef } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { subscribeToUserNotifications, type Notification } from "@/lib/notification-service"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/language-context"
import { useTranslation } from "@/lib/translation-context"

// Note: This component must be used within LanguageProvider and TranslationProvider
// to access translations from en.json and ur.json
export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const { t } = useTranslation()
  const { isRTL } = useLanguage()

  // Subscribe to notifications
  useEffect(() => {
    if (!user) return
    let unsubscribe: () => void = () => {}
    try {
      unsubscribe = subscribeToUserNotifications(user.uid, (newNotifications) => {
        setNotifications(newNotifications)
        setUnreadCount(newNotifications.filter((n) => !n.read).length)
        setError(null)
      })
    } catch (err) {
      console.error("Failed to subscribe to notifications:", err)
      setError(t("notifications.error"))
      toast({
        title: t("notifications.errorTitle"),
        description: t("notifications.errorDescription"),
        variant: "destructive",
      })
    }
    return () => {
      try {
        unsubscribe()
      } catch (err) {
        console.error("Error unsubscribing from notifications:", err)
      }
    }
  }, [user, toast, t])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false)
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  const handleNotificationClick = (notification: Notification) => {
    if (notification.type === "question_answered" && notification.relatedId) {
      router.push(`/questions/${notification.relatedId}`)
    } else if (
      notification.type === "question_approved" ||
      notification.type === "question_rejected"
    ) {
      router.push("/dashboard")
    }
    setIsOpen(false)
  }

  if (!user) return null

  // Align dropdown: LTR => right-0, RTL => left-0
  const dropdownPositionClass = isRTL ? "left-0" : "right-0"

  return (
    <div className="relative" ref={wrapperRef} dir={isRTL ? "rtl" : "ltr"}>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            variant="destructive"
          >
            {unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div
          className={`absolute mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 ${dropdownPositionClass}`}
          dir={isRTL ? "rtl" : "ltr"}
        >
          <div className="p-2 font-medium border-b">{t("notifications.title")}</div>
          <div className="max-h-[300px] overflow-y-auto">
            {error ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {t("notifications.error")}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {t("notifications.empty")}
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 cursor-pointer hover:bg-gray-100 ${!notification.read ? "bg-gray-50" : ""}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex flex-col gap-1">
                    <div className="font-medium">{notification.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {notification.message}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(notification.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}