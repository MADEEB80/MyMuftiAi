import { db } from "./firebase"
import { collection, addDoc, getDocs, getDoc, doc, query, where, updateDoc, deleteDoc } from "firebase/firestore"

export interface Answer {
  id?: string
  questionId: string
  content: string
  scholarId: string
  scholarName: string
  createdAt: Date
  updatedAt: Date
  language: string // Added language field
  references?: string[]
}

// Create a new answer
export async function createAnswer(answerData: Omit<Answer, "id" | "createdAt" | "updatedAt">): Promise<string> {
  try {
    const now = new Date()
    const docRef = await addDoc(collection(db, "answers"), {
      ...answerData,
      createdAt: now,
      updatedAt: now,
      language: answerData.language || "en", // Default to English if not specified
    })
    return docRef.id
  } catch (error) {
    console.error("Error creating answer:", error)
    throw error
  }
}

// Get all answers for a question - modified to avoid index requirement
export async function getAnswersByQuestionId(questionId: string): Promise<Answer[]> {
  try {
    // Use only the where clause without orderBy to avoid requiring the composite index
    const q = query(collection(db, "answers"), where("questionId", "==", questionId))
    const querySnapshot = await getDocs(q)

    // Sort the results in memory instead
    const answers = querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        }) as Answer,
    )

    // Sort by createdAt in descending order (newest first)
    return answers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  } catch (error) {
    console.error("Error getting answers:", error)
    return []
  }
}

// Get answers by question ID and language - modified to avoid index requirement
export async function getAnswersByQuestionIdAndLanguage(questionId: string, language: string): Promise<Answer[]> {
  try {
    // First get all answers for the question
    const q = query(collection(db, "answers"), where("questionId", "==", questionId))
    const querySnapshot = await getDocs(q)

    // Then filter by language and sort in memory
    const answers = querySnapshot.docs
      .map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
          }) as Answer,
      )
      .filter((answer) => answer.language === language)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    return answers
  } catch (error) {
    console.error("Error getting answers by language:", error)
    return []
  }
}

// Get an answer by ID
export async function getAnswerById(id: string): Promise<Answer | null> {
  try {
    const docRef = doc(db, "answers", id)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as Answer
    } else {
      console.log("No such answer!")
      return null
    }
  } catch (error) {
    console.error("Error getting answer:", error)
    return null
  }
}

// Update an answer
export async function updateAnswer(id: string, answerData: Partial<Answer>): Promise<void> {
  try {
    const docRef = doc(db, "answers", id)
    await updateDoc(docRef, {
      ...answerData,
      updatedAt: new Date(),
    })
  } catch (error) {
    console.error("Error updating answer:", error)
    throw error
  }
}

// Delete an answer
export async function deleteAnswer(id: string): Promise<void> {
  try {
    const docRef = doc(db, "answers", id)
    await deleteDoc(docRef)
  } catch (error) {
    console.error("Error deleting answer:", error)
    throw error
  }
}

// Get answers by scholar ID
export async function getAnswersByScholarId(scholarId: string): Promise<Answer[]> {
  try {
    const q = query(collection(db, "answers"), where("scholarId", "==", scholarId))
    const querySnapshot = await getDocs(q)

    const answers = querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        }) as Answer,
    )

    // Sort by createdAt in descending order
    return answers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  } catch (error) {
    console.error("Error getting answers by scholar:", error)
    return []
  }
}
