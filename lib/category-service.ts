import { db } from "./firebase"
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore"

// Updated Category type
export interface Category {
  id?: string
  slug: string
  name: string
  description: string
  createdAt?: Date
  updatedAt?: Date
  questionCount?: number
}

const categoriesCollection = collection(db, "categories")
const questionsCollection = collection(db, "questions")

// Get all categories (without language filter)
export async function getAllCategories(): Promise<Category[]> {
  const snapshot = await getDocs(categoriesCollection)
  const categories = snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      slug: data.slug,
      name: data.name,
      description: data.description,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    } as Category
  })

  const categoriesWithCounts = await Promise.all(
    categories.map(async (category) => {
      const q = query(questionsCollection, where("categoryId", "==", category.id))
      const questionSnapshot = await getDocs(q)
      return {
        ...category,
        questionCount: questionSnapshot.size,
      }
    })
  )

  return categoriesWithCounts
}

// Get categories by language
export async function getCategoriesByLanguage(language: string): Promise<Category[]> {
  const q = query(categoriesCollection, where("language", "==", language))
  const snapshot = await getDocs(q)

  const categories = snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      slug: data.slug,
      name: data.name,
      description: data.description,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    } as Category
  })

  const categoriesWithCounts = await Promise.all(
    categories.map(async (category) => {
      const q = query(questionsCollection, where("categoryId", "==", category.id))
      const questionSnapshot = await getDocs(q)
      return {
        ...category,
        questionCount: questionSnapshot.size,
      }
    })
  )

  return categoriesWithCounts
}

// Get category by ID
export async function getCategoryById(id: string): Promise<Category | null> {
  const docRef = doc(db, "categories", id)
  const snapshot = await getDoc(docRef)

  if (!snapshot.exists()) {
    return null
  }

  return {
    id: snapshot.id,
    ...(snapshot.data() as Omit<Category, "id">),
  }
}

// Create a new category
export async function createCategory(category: Omit<Category, "id">): Promise<string> {
  const docRef = await addDoc(categoriesCollection, {
    ...category,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  return docRef.id
}

// Update an existing category
export async function updateCategory(id: string, category: Partial<Omit<Category, "id">>): Promise<void> {
  const docRef = doc(db, "categories", id)
  await updateDoc(docRef, {
    ...category,
    updatedAt: new Date(),
  })
}

// Delete a category
export async function deleteCategory(id: string): Promise<void> {
  const docRef = doc(db, "categories", id)
  await deleteDoc(docRef)
}
