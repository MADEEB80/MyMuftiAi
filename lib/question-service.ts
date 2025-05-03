import { db } from "./firebase"
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  type CollectionReference,
} from "firebase/firestore"
import type { Question, QuestionStatus } from "@/types/question"

// Safely get collection reference
const getCollection = (collectionName: string): CollectionReference => {
  if (!db) {
    throw new Error("Firestore database not initialized")
  }
  return collection(db, collectionName)
}

// Collection reference
const questionsCollection = () => getCollection("questions")

// Get all questions
export async function getAllQuestions(): Promise<Question[]> {
  try {
    const snapshot = await getDocs(questionsCollection())
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Question, "id">),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    }))
  } catch (error) {
    console.error("Error getting all questions:", error)
    return []
  }
}

// Get question by ID
export async function getQuestionById(id: string): Promise<Question | null> {
  try {
    const docRef = doc(db, "questions", id)
    const snapshot = await getDoc(docRef)

    if (!snapshot.exists()) {
      return null
    }

    const data = snapshot.data()
    return {
      id: snapshot.id,
      ...(data as Omit<Question, "id">),
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    }
  } catch (error) {
    console.error(`Error getting question with ID ${id}:`, error)
    return null
  }
}

// Create a new question
export async function createQuestion(question: Omit<Question, "id">): Promise<string> {
  try {
    const docRef = await addDoc(questionsCollection(), {
      ...question,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
    return docRef.id
  } catch (error) {
    console.error("Error creating question:", error)
    throw error
  }
}

// Update an existing question
export async function updateQuestion(id: string, question: Partial<Omit<Question, "id">>): Promise<void> {
  try {
    const docRef = doc(db, "questions", id)
    await updateDoc(docRef, {
      ...question,
      updatedAt: Timestamp.now(),
    })
  } catch (error) {
    console.error(`Error updating question with ID ${id}:`, error)
    throw error
  }
}

// Delete a question
export async function deleteQuestion(id: string): Promise<void> {
  try {
    const docRef = doc(db, "questions", id)
    await deleteDoc(docRef)
  } catch (error) {
    console.error(`Error deleting question with ID ${id}:`, error)
    throw error
  }
}

// Get questions by user ID
export async function getQuestionsByUserId(userId: string): Promise<Question[]> {
  try {
    const q = query(questionsCollection(), where("userId", "==", userId))
    const snapshot = await getDocs(q)

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Question, "id">),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    }))
  } catch (error) {
    console.error(`Error getting questions for user ${userId}:`, error)
    return []
  }
}

// Get questions by user ID and language
export async function getQuestionsByUserIdAndLanguage(userId: string, language: string): Promise<Question[]> {
  try {
    const q = query(questionsCollection(), where("userId", "==", userId), where("language", "==", language))
    const snapshot = await getDocs(q)

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Question, "id">),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    }))
  } catch (error) {
    console.error(`Error getting questions for user ${userId} in ${language}:`, error)
    return []
  }
}

// Get questions by status
export async function getQuestionsByStatus(status: QuestionStatus): Promise<Question[]> {
  try {
    const q = query(questionsCollection(), where("status", "==", status))
    const snapshot = await getDocs(q)

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Question, "id">),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    }))
  } catch (error) {
    console.error(`Error getting questions with status ${status}:`, error)
    return []
  }
}

// Get recent questions
export async function getRecentQuestions(count = 5): Promise<Question[]> {
  try {
    const q = query(
      questionsCollection(),
      where("status", "==", "answered"),
      orderBy("createdAt", "desc"),
      limit(count),
    )
    const snapshot = await getDocs(q)

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Question, "id">),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    }))
  } catch (error) {
    console.error("Error getting recent questions:", error)
    return []
  }
}

// Get recent answered questions (for backward compatibility)
export async function getRecentAnsweredQuestions(language = "en", limitCount = 10): Promise<Question[]> {
  return getRecentAnsweredQuestionsByLanguage(language, limitCount)
}

// Get recent answered questions by language
// Updated to avoid requiring complex composite index
export async function getRecentAnsweredQuestionsByLanguage(language: string, count = 5): Promise<Question[]> {
  // First try with a simple query based on status only
  try {
    // Just query for answered questions without ordering by answeredAt
    const q = query(
      questionsCollection(),
      where("status", "==", "answered"),
      where("language", "==", language),
      limit(count),
    )

    const snapshot = await getDocs(q)

    // Sort client-side by answeredAt
    return snapshot.docs
      .sort((a, b) => {
        const dateA = a.data().answeredAt?.toDate() || new Date(0)
        const dateB = b.data().answeredAt?.toDate() || new Date(0)
        return dateB.getTime() - dateA.getTime() // descending order
      })
      .slice(0, count)
      .map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Question, "id">),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        answeredAt: doc.data().answeredAt?.toDate(),
      }))
  } catch (error) {
    console.error(`Error getting recent answered questions in ${language}:`, error)

    // If the above fails, try an even simpler approach
    try {
      const simpleQ = query(questionsCollection(), where("status", "==", "answered"))
      const simpleSnapshot = await getDocs(simpleQ)

      // Filter and sort client-side
      return simpleSnapshot.docs
        .filter((doc) => doc.data().language === language)
        .sort((a, b) => {
          const dateA = a.data().answeredAt?.toDate() || new Date(0)
          const dateB = b.data().answeredAt?.toDate() || new Date(0)
          return dateB.getTime() - dateA.getTime() // descending order
        })
        .slice(0, count)
        .map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Question, "id">),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          answeredAt: doc.data().answeredAt?.toDate(),
        }))
    } catch (fallbackError) {
      console.error(`Fallback query also failed for recent answered questions:`, fallbackError)
      return []
    }
  }
}

// Get questions by category
export async function getQuestionsByCategory(category: string): Promise<Question[]> {
  try {
    const q = query(questionsCollection(), where("category", "==", category), where("status", "==", "answered"))
    const snapshot = await getDocs(q)

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Question, "id">),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    }))
  } catch (error) {
    console.error(`Error getting questions for category ${category}:`, error)
    return []
  }
}

// Search questions
export async function searchQuestions(searchTerm: string): Promise<Question[]> {
  try {
    // Firestore doesn't support full-text search natively
    // This is a simple implementation that checks if the title or content contains the search term
    const snapshot = await getDocs(questionsCollection())

    const results = snapshot.docs.filter((doc) => {
      const data = doc.data()
      const title = data.title?.toLowerCase() || ""
      const content = data.content?.toLowerCase() || ""
      const term = searchTerm.toLowerCase()

      return title.includes(term) || content.includes(term)
    })

    return results.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Question, "id">),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    }))
  } catch (error) {
    console.error(`Error searching questions for term ${searchTerm}:`, error)
    return []
  }
}

// Get questions by category ID and language
export async function getQuestionsByCategoryIdAndLanguage(categoryId: string, language: string): Promise<Question[]> {
  try {
    const q = query(
      questionsCollection(),
      where("category", "==", categoryId),
      where("language", "==", language),
      where("status", "==", "answered"),
    )
    const snapshot = await getDocs(q)

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Question, "id">),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    }))
  } catch (error) {
    console.error(`Error getting questions for category ${categoryId} in ${language}:`, error)
    return []
  }
}

// Get questions assigned to a scholar
export async function getQuestionsByScholarId(scholarId: string): Promise<Question[]> {
  try {
    const q = query(questionsCollection(), where("assignedTo", "==", scholarId), where("status", "==", "approved"))
    const snapshot = await getDocs(q)

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Question, "id">),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    }))
  } catch (error) {
    console.error(`Error getting questions assigned to scholar ${scholarId}:`, error)
    return []
  }
}

// Get questions answered by a scholar
export async function getQuestionsAnsweredByScholarId(scholarId: string): Promise<Question[]> {
  try {
    const q = query(questionsCollection(), where("answeredBy", "==", scholarId), where("status", "==", "answered"))
    const snapshot = await getDocs(q)

    // Sort client-side by answeredAt
    return snapshot.docs
      .sort((a, b) => {
        const dateA = a.data().answeredAt?.toDate() || new Date(0)
        const dateB = b.data().answeredAt?.toDate() || new Date(0)
        return dateB.getTime() - dateA.getTime() // descending order
      })
      .map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Question, "id">),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        answeredAt: doc.data().answeredAt?.toDate(),
      }))
  } catch (error) {
    console.error(`Error getting questions answered by scholar ${scholarId}:`, error)
    return []
  }
}

// Assign question to scholar
export async function assignQuestionToScholar(
  questionId: string,
  scholarId: string,
  scholarName: string,
): Promise<void> {
  try {
    const docRef = doc(db, "questions", questionId)
    await updateDoc(docRef, {
      assignedTo: scholarId,
      scholarName: scholarName,
      status: "approved",
      updatedAt: Timestamp.now(),
    })
  } catch (error) {
    console.error(`Error assigning question ${questionId} to scholar ${scholarId}:`, error)
    throw error
  }
}

// Answer a question
export async function answerQuestion(
  questionId: string,
  answer: string,
  scholarId: string,
  scholarName: string,
): Promise<void> {
  try {
    const docRef = doc(db, "questions", questionId)
    await updateDoc(docRef, {
      status: "answered",
      answer: answer,
      answeredBy: scholarId,
      scholarName: scholarName,
      answeredAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
  } catch (error) {
    console.error(`Error answering question ${questionId}:`, error)
    throw error
  }
}

// Get pending questions for admin review
export async function getPendingQuestionsForAdmin(): Promise<Question[]> {
  try {
    const q = query(questionsCollection(), where("status", "==", "pending"))
    const snapshot = await getDocs(q)

    // Sort client-side by createdAt
    return snapshot.docs
      .sort((a, b) => {
        const dateA = a.data().createdAt?.toDate() || new Date(0)
        const dateB = b.data().createdAt?.toDate() || new Date(0)
        return dateB.getTime() - dateA.getTime() // descending order
      })
      .map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Question, "id">),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      }))
  } catch (error) {
    console.error("Error getting pending questions for admin:", error)
    return []
  }
}

// Get approved but unassigned questions
export async function getApprovedUnassignedQuestions(): Promise<Question[]> {
  try {
    // Simpler query without the null check
    const allApprovedQ = query(questionsCollection(), where("status", "==", "approved"))
    const allApprovedSnapshot = await getDocs(allApprovedQ)

    // Filter client-side for unassigned questions
    return allApprovedSnapshot.docs
      .filter((doc) => !doc.data().assignedTo)
      .sort((a, b) => {
        const dateA = a.data().createdAt?.toDate() || new Date(0)
        const dateB = b.data().createdAt?.toDate() || new Date(0)
        return dateB.getTime() - dateA.getTime() // descending order
      })
      .map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Question, "id">),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      }))
  } catch (error) {
    console.error("Error getting approved unassigned questions:", error)
    return []
  }
}
