import { db } from "./firebase"
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore"

// Define the language type
export type Language = "en" | "ur"

// Function to get questions by language
export async function getQuestionsByLanguage(language: Language) {
  try {
    const q = query(collection(db, "questions"), where("language", "==", language))
    const querySnapshot = await getDocs(q)

    const questions = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return questions
  } catch (error) {
    console.error("Error getting questions by language:", error)
    throw error
  }
}

// Function to get answers by language
export async function getAnswersByLanguage(language: Language) {
  try {
    const q = query(collection(db, "answers"), where("language", "==", language))
    const querySnapshot = await getDocs(q)

    const answers = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return answers
  } catch (error) {
    console.error("Error getting answers by language:", error)
    throw error
  }
}

// Function to update question language
export async function updateQuestionLanguage(questionId: string, language: Language) {
  try {
    const questionRef = doc(db, "questions", questionId)
    await updateDoc(questionRef, {
      language,
    })
    return true
  } catch (error) {
    console.error("Error updating question language:", error)
    throw error
  }
}

// Function to update answer language
export async function updateAnswerLanguage(answerId: string, language: Language) {
  try {
    const answerRef = doc(db, "answers", answerId)
    await updateDoc(answerRef, {
      language,
    })
    return true
  } catch (error) {
    console.error("Error updating answer language:", error)
    throw error
  }
}

// Function to update user preferred language
export async function updateUserLanguagePreference(userId: string, language: Language) {
  try {
    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, {
      preferredLanguage: language,
    })
    return true
  } catch (error) {
    console.error("Error updating user language preference:", error)
    throw error
  }
}

// Function to get categories by language
export async function getCategoriesByLanguage(language: Language) {
  try {
    const q = query(collection(db, "categories"), where("language", "==", language))
    const querySnapshot = await getDocs(q)

    const categories = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return categories
  } catch (error) {
    console.error("Error getting categories by language:", error)
    throw error
  }
}
