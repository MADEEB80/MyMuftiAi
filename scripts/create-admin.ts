import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore"
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth"
import { initializeApp } from "firebase/app"

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCMk112qoe44Ac81SjvAd4Y9XLvNwwtN3c",
  authDomain: "mymufti1080.firebaseapp.com",
  projectId: "mymufti1080",
  storageBucket: "mymufti1080.firebasestorage.app",
  messagingSenderId: "558044786458",
  appId: "1:558044786458:web:df4441667e5d71c1dcc6a3",
  measurementId: "G-LY1D6LNG6F",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

/**
 * Create an admin user
 * @param email Admin email
 * @param password Admin password
 * @param displayName Admin display name
 */
async function createAdminUser(email: string, password: string, displayName: string) {
  try {
    // Check if user exists
    try {
      // Try to sign in
      await signInWithEmailAndPassword(auth, email, password)
      console.log("User already exists. Updating role to admin...")
    } catch (error) {
      // User doesn't exist, create new user
      console.log("Creating new user...")
      await createUserWithEmailAndPassword(auth, email, password)
    }

    // Get the current user
    const user = auth.currentUser
    if (!user) {
      throw new Error("Failed to get current user")
    }

    // Check if user document exists
    const userDoc = await getDoc(doc(db, "users", user.uid))

    // Create or update user document with admin role
    await setDoc(
      doc(db, "users", user.uid),
      {
        displayName: displayName || "Admin",
        email: email,
        role: "admin",
        status: "active",
        createdAt: userDoc.exists() ? userDoc.data().createdAt : new Date(),
        updatedAt: new Date(),
      },
      { merge: true },
    )

    console.log(`Admin user created/updated successfully: ${email}`)
  } catch (error) {
    console.error("Error creating admin user:", error)
  }
}

// Example usage
// Replace with your desired admin credentials
const adminEmail = "admin@example.com"
const adminPassword = "StrongPassword123!"
const adminName = "System Administrator"

createAdminUser(adminEmail, adminPassword, adminName)
  .then(() => console.log("Admin creation process completed"))
  .catch((error) => console.error("Error in admin creation process:", error))
