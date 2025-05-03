"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { subscribeToUserNotifications, type Notification } from "@/lib/notification-service"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (!user) return

    let unsubscribe: () => void = () => {}

    try {
      unsubscribe = subscribeToUserNotifications(user.uid, (newNotifications) => {
        setNotifications(newNotifications)
        setUnreadCount(newNotifications.filter((n) => !n.read).length)
        setError(null) // Clear any previous errors
      })
    } catch (err) {
      console.error("Failed to subscribe to notifications:", err)
      setError("Failed to load notifications")

      // Show toast for error
      toast({
        title: "Notification Error",
        description: "There was a problem loading your notifications. Please try again later.",
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
  }, [user, toast])

  const handleNotificationClick = (notification: Notification) => {
    // Navigate to the relevant page based on notification type
    if (notification.type === "question_answered" && notification.relatedId) {
      router.push(`/questions/${notification.relatedId}`)
    } else if (notification.type === "question_approved" || notification.type === "question_rejected") {
      router.push("/dashboard")
    }

    // Mark as read logic would go here
    setIsOpen(false)
  }

  if (!user) return null

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" className="relative" onClick={() => setIsOpen(!isOpen)}>
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
        <div className="absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
          <div className="p-2 font-medium border-b">Notifications</div>
          <div className="max-h-[300px] overflow-y-auto">
            {error ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Failed to load notifications. Please try again later.
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">No notifications</div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 cursor-pointer hover:bg-gray-100 ${!notification.read ? "bg-gray-50" : ""}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex flex-col gap-1">
                    <div className="font-medium">{notification.title}</div>
                    <div className="text-sm text-muted-foreground">{notification.message}</div>
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
