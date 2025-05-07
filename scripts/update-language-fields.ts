import { db } from "../lib/firebase"
import { collection, getDocs, updateDoc, doc } from "firebase/firestore"

// Default language to set for existing records
const DEFAULT_LANGUAGE = "en"

// Function to update all questions with language field
export async function updateQuestionsWithLanguageField() {
  try {
    const querySnapshot = await getDocs(collection(db, "questions"))

    const updatePromises = querySnapshot.docs.map(async (docSnapshot) => {
      const questionData = docSnapshot.data()

      // Only update if language field doesn't exist
      if (!questionData.language) {
        const questionRef = doc(db, "questions", docSnapshot.id)
        await updateDoc(questionRef, {
          language: DEFAULT_LANGUAGE,
        })
        console.log(`Updated question ${docSnapshot.id} with language field`)
      }
    })

    await Promise.all(updatePromises)
    console.log("All questions updated with language field")
    return true
  } catch (error) {
    console.error("Error updating questions with language field:", error)
    throw error
  }
}

// Main function to update all collections
export async function updateAllCollectionsWithLanguageFields() {
  try {
    await updateQuestionsWithLanguageField()
    console.log("All collections updated with language fields")
    return true
  } catch (error) {
    console.error("Error updating collections with language fields:", error)
    throw error
  }
}
