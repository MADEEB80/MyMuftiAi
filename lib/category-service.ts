import { db } from "./firebase"
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where } from "firebase/firestore"

// Define the Category type
export interface Category {
  id?: string
  name: string
  description: string
  createdAt?: Date
  updatedAt?: Date
  language?: string // Add language field
  questionCount?: number
  slug?: string
  value?: string
}

// Safely get collection reference
const getCollection = (collectionName: string) => {
  if (!db) {
    throw new Error("Firestore database not initialized")
  }
  return collection(db, collectionName)
}

// Collection reference
const categoriesCollection = () => getCollection("categories")

// Get all categories
export async function getAllCategories(language = "en"): Promise<Category[]> {
  try {
    // Try to get categories filtered by language - simple query without ordering
    const q = query(categoriesCollection(), where("language", "==", language))

    try {
      const snapshot = await getDocs(q)

      if (!snapshot.empty) {
        const categories = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Category, "id">),
          questionCount: doc.data().questionCount || 0,
          value: doc.data().value || doc.id,
        }))

        // Sort client-side instead of in the query
        return categories.sort((a, b) => (a.name || "").localeCompare(b.name || ""))
      }
    } catch (error) {
      console.error("Error with language-filtered query:", error)
      // Continue to fallback
    }

    // Fallback: If error or no language-specific categories, get all categories
    const allSnapshot = await getDocs(categoriesCollection())
    const allCategories = allSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Category, "id">),
      questionCount: doc.data().questionCount || 0,
      value: doc.data().value || doc.id,
    }))

    // Filter by language client-side
    const filteredCategories = allCategories.filter((cat) => cat.language === language)

    // If we have language-specific categories, return those
    if (filteredCategories.length > 0) {
      return filteredCategories.sort((a, b) => (a.name || "").localeCompare(b.name || ""))
    }

    // Otherwise return all categories
    return allCategories.sort((a, b) => (a.name || "").localeCompare(b.name || ""))
  } catch (error) {
    console.error("Error getting all categories:", error)
    return []
  }
}

// Get category by ID
export async function getCategoryById(id: string): Promise<Category | null> {
  try {
    const docRef = doc(db, "categories", id)
    const snapshot = await getDoc(docRef)

    if (!snapshot.exists()) {
      return null
    }

    return {
      id: snapshot.id,
      ...(snapshot.data() as Omit<Category, "id">),
    }
  } catch (error) {
    console.error(`Error getting category with ID ${id}:`, error)
    return null
  }
}

// Create a new category
export async function createCategory(category: Omit<Category, "id">): Promise<string> {
  try {
    const docRef = await addDoc(categoriesCollection(), {
      ...category,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    return docRef.id
  } catch (error) {
    console.error("Error creating category:", error)
    throw error
  }
}

// Update an existing category
export async function updateCategory(id: string, category: Partial<Omit<Category, "id">>): Promise<void> {
  try {
    const docRef = doc(db, "categories", id)
    await updateDoc(docRef, {
      ...category,
      updatedAt: new Date(),
    })
  } catch (error) {
    console.error(`Error updating category with ID ${id}:`, error)
    throw error
  }
}

// Delete a category
export async function deleteCategory(id: string): Promise<void> {
  try {
    const docRef = doc(db, "categories", id)
    await deleteDoc(docRef)
  } catch (error) {
    console.error(`Error deleting category with ID ${id}:`, error)
    throw error
  }
}

// Get categories by language
export async function getCategoriesByLanguage(language: string): Promise<Category[]> {
  try {
    // Simple query without ordering
    const q = query(categoriesCollection(), where("language", "==", language))

    try {
      const snapshot = await getDocs(q)
      const categories = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Category, "id">),
        questionCount: doc.data().questionCount || 0,
        value: doc.data().value || doc.id,
      }))

      // Sort client-side
      return categories.sort((a, b) => (a.name || "").localeCompare(b.name || ""))
    } catch (error) {
      console.error(`Error with language query for ${language}:`, error)

      // Fallback: Get all categories and filter client-side
      const allSnapshot = await getDocs(categoriesCollection())
      const allCategories = allSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Category, "id">),
        questionCount: doc.data().questionCount || 0,
        value: doc.data().value || doc.id,
      }))

      // Filter by language client-side
      const filteredCategories = allCategories.filter((cat) => cat.language === language)

      // Sort client-side
      return filteredCategories.sort((a, b) => (a.name || "").localeCompare(b.name || ""))
    }
  } catch (error) {
    console.error(`Error getting categories for language ${language}:`, error)
    return []
  }
}
