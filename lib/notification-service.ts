import { collection, addDoc, serverTimestamp, query, where, onSnapshot, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

export type NotificationType = "question_answered" | "question_approved" | "question_rejected" | "system_announcement"

export interface Notification {
  id?: string
  userId: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  relatedId?: string // ID of related item (question, answer, etc.)
  createdAt?: any
}

export const createNotification = async (notification: Omit<Notification, "read" | "createdAt">) => {
  try {
    await addDoc(collection(db, "notifications"), {
      ...notification,
      read: false,
      createdAt: serverTimestamp(),
    })
    return true
  } catch (error) {
    console.error("Error creating notification:", error)
    return false
  }
}

export const subscribeToUserNotifications = (userId: string, callback: (notifications: Notification[]) => void) => {
  // Create a query without orderBy to avoid index requirements
  const q = query(collection(db, "notifications"), where("userId", "==", userId))

  try {
    return onSnapshot(
      q,
      (querySnapshot) => {
        const notifications: Notification[] = []
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          notifications.push({
            id: doc.id,
            userId: data.userId,
            type: data.type,
            title: data.title,
            message: data.message,
            read: data.read,
            relatedId: data.relatedId,
            createdAt: data.createdAt?.toDate() || new Date(),
          })
        })

        // Sort client-side instead of using orderBy in the query
        notifications.sort((a, b) => {
          return b.createdAt.getTime() - a.createdAt.getTime()
        })

        callback(notifications)
      },
      (error) => {
        console.error("Error listening to notifications:", error)

        // Fallback to a one-time query without orderBy if the listener fails
        const fallbackFetch = async () => {
          try {
            const fallbackQuery = query(collection(db, "notifications"), where("userId", "==", userId))
            const querySnapshot = await getDocs(fallbackQuery)

            const notifications: Notification[] = []
            querySnapshot.forEach((doc) => {
              const data = doc.data()
              notifications.push({
                id: doc.id,
                userId: data.userId,
                type: data.type,
                title: data.title,
                message: data.message,
                read: data.read,
                relatedId: data.relatedId,
                createdAt: data.createdAt?.toDate() || new Date(),
              })
            })

            // Sort client-side
            notifications.sort((a, b) => {
              return b.createdAt.getTime() - a.createdAt.getTime()
            })

            callback(notifications)
          } catch (fallbackError) {
            console.error("Error in fallback notification fetch:", fallbackError)
            callback([]) // Return empty array as last resort
          }
        }

        fallbackFetch()
      },
    )
  } catch (error) {
    console.error("Error setting up notification listener:", error)
    // Return a no-op unsubscribe function
    return () => {}
  }
}

export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const notificationRef = collection(db, "notifications")
    await addDoc(notificationRef, {
      id: notificationId,
      read: true,
    })
    return true
  } catch (error) {
    console.error("Error marking notification as read:", error)
    return false
  }
}
