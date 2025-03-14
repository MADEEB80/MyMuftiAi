import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  setDoc,
  deleteDoc,
} from "firebase/firestore"
import { db } from "@/lib/firebase"

// User roles
export type UserRole = "user" | "scholar" | "admin"

// User status
export type UserStatus = "active" | "blocked"

// User interface
export interface User {
  id: string
  displayName: string
  email: string
  role: UserRole
  status: UserStatus
  createdAt: Date
  updatedAt?: Date
}

/**
 * Get a user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  try {
    const userDoc = await getDoc(doc(db, "users", userId))

    if (!userDoc.exists()) {
      return null
    }

    const userData = userDoc.data()

    return {
      id: userDoc.id,
      displayName: userData.displayName || "Unknown",
      email: userData.email || "",
      role: userData.role || "user",
      status: userData.status || "active",
      createdAt: userData.createdAt?.toDate() || new Date(),
      updatedAt: userData.updatedAt?.toDate(),
    }
  } catch (error) {
    console.error("Error getting user:", error)
    throw error
  }
}

/**
 * Get a user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const usersQuery = query(collection(db, "users"), where("email", "==", email))
    const querySnapshot = await getDocs(usersQuery)

    if (querySnapshot.empty) {
      return null
    }

    const userDoc = querySnapshot.docs[0]
    const userData = userDoc.data()

    return {
      id: userDoc.id,
      displayName: userData.displayName || "Unknown",
      email: userData.email || "",
      role: userData.role || "user",
      status: userData.status || "active",
      createdAt: userData.createdAt?.toDate() || new Date(),
      updatedAt: userData.updatedAt?.toDate(),
    }
  } catch (error) {
    console.error("Error getting user by email:", error)
    throw error
  }
}

/**
 * Update a user's role
 */
export async function updateUserRole(userId: string, role: UserRole): Promise<void> {
  try {
    await updateDoc(doc(db, "users", userId), {
      role,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error updating user role:", error)
    throw error
  }
}

/**
 * Update a user's status
 */
export async function updateUserStatus(userId: string, status: UserStatus): Promise<void> {
  try {
    await updateDoc(doc(db, "users", userId), {
      status,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error updating user status:", error)
    throw error
  }
}

/**
 * Create or update a user
 */
export async function createOrUpdateUser(userId: string, userData: Partial<User>): Promise<void> {
  try {
    const userRef = doc(db, "users", userId)
    const userDoc = await getDoc(userRef)

    if (userDoc.exists()) {
      // Update existing user
      await updateDoc(userRef, {
        ...userData,
        updatedAt: serverTimestamp(),
      })
    } else {
      // Create new user
      await setDoc(userRef, {
        ...userData,
        role: userData.role || "user",
        status: userData.status || "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    }
  } catch (error) {
    console.error("Error creating/updating user:", error)
    throw error
  }
}

/**
 * Delete a user
 */
export async function deleteUser(userId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "users", userId))
  } catch (error) {
    console.error("Error deleting user:", error)
    throw error
  }
}

/**
 * Check if a user is an admin
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const user = await getUserById(userId)
    return user?.role === "admin"
  } catch (error) {
    console.error("Error checking if user is admin:", error)
    return false
  }
}

/**
 * Check if a user is a scholar
 */
export async function isUserScholar(userId: string): Promise<boolean> {
  try {
    const user = await getUserById(userId)
    return user?.role === "scholar"
  } catch (error) {
    console.error("Error checking if user is scholar:", error)
    return false
  }
}

