import { db } from "./firebase"
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where } from "firebase/firestore"

// Define the Category type
export interface Category {
  id?: string
  name: string
  description: string
  createdAt?: Date
  updatedAt?: Date
}

// Collection reference
const categoriesCollection = collection(db, "categories")

// Get all categories
export async function getAllCategories(): Promise<Category[]> {
  const snapshot = await getDocs(categoriesCollection)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Category, "id">),
  }))
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

// Get categories by language
export async function getCategoriesByLanguage(language: string): Promise<Category[]> {
  const q = query(categoriesCollection, where("language", "==", language))
  const snapshot = await getDocs(q)

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Category, "id">),
  }))
}
