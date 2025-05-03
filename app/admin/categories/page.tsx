import { collection, query, orderBy, getDocs, where, getCountFromServer } from "firebase/firestore"
import { db } from "@/lib/firebase"
import CategoriesManagement from './CategoriesManagement'

interface Category {
  id: string
  name: string
  value: string
  description: string
  questionCount: number
  createdAt: Date
  updatedAt?: Date
}

async function fetchCategories() {
  try {
    const q = query(collection(db, "categories"), orderBy("name", "asc"))
    const querySnapshot = await getDocs(q)
    const fetchedCategories: Category[] = []

    for (const doc of querySnapshot.docs) {
      const data = doc.data()
      const questionsQuery = query(collection(db, "questions"), where("category", "==", data.value || doc.id))
      const questionsSnapshot = await getCountFromServer(questionsQuery)
      const questionCount = questionsSnapshot.data().count

      fetchedCategories.push({
        id: doc.id,
        name: data.name || "Unknown",
        value: data.value || doc.id,
        description: data.description || "",
        questionCount: questionCount,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate(),
      })
    }
    return fetchedCategories
  } catch (error) {
    console.error("Error fetching categories:", error)
    return []
  }
}

export default async function CategoriesPage() {
  const categories = await fetchCategories()
  return <CategoriesManagement initialCategories={categories} />
}