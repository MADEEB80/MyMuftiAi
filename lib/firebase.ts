// Import the functions you need from the SDKs you need
import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { getFirestore, type Firestore } from "firebase/firestore"
import { getAuth, type Auth } from "firebase/auth"
import { getStorage, type FirebaseStorage } from "firebase/storage"

// Your Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase
let app: FirebaseApp
let db: Firestore
let auth: Auth
let storage: FirebaseStorage

// Check if we're in the browser environment
if (typeof window !== "undefined") {
  try {
    // Check if Firebase is already initialized
    if (!getApps().length) {
      app = initializeApp(firebaseConfig)
    } else {
      app = getApps()[0]
    }

    // Initialize Firestore, Auth, and Storage
    db = getFirestore(app)
    auth = getAuth(app)
    storage = getStorage(app)
  } catch (error) {
    console.error("Error initializing Firebase:", error)
    throw error
  }
} else {
  // Server-side initialization
  if (!getApps().length) {
    app = initializeApp(firebaseConfig)
    db = getFirestore(app)
    auth = getAuth(app)
    storage = getStorage(app)
  } else {
    app = getApps()[0]
    db = getFirestore(app)
    auth = getAuth(app)
    storage = getStorage(app)
  }
}

export { db, auth, storage }
export default app
