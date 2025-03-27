import { initializeApp, getApps } from "firebase/app"
import {
  getAuth,
  signInWithEmailAndPassword as firebaseSignIn,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
} from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getUserById } from "./users"
import { getFirebaseConfig } from "./config"

// Initialize Firebase only if it hasn't been initialized already
const app = getApps().length === 0 ? initializeApp(getFirebaseConfig()) : getApps()[0]
const auth = getAuth(app)
const db = getFirestore(app)

// Fix the authentication to ensure proper role assignment
export async function signIn(email: string, password: string) {
  try {
    const userCredential = await firebaseSignIn(auth, email, password)
    const user = userCredential.user

    // Get additional user data from Firestore
    const userData = await getUserById(user.uid)

    if (!userData) {
      // If user doesn't exist in Firestore yet, return basic info
      console.log("User not found in database")
      throw new Error("User not found in database")
    }

    console.log("User signed in with role:", userData.role)
    return userData
  } catch (error) {
    console.error("Error signing in:", error)
    throw error
  }
}

// Sign out
export async function signOut() {
  try {
    await firebaseSignOut(auth)
    return true
  } catch (error) {
    console.error("Error signing out:", error)
    throw error
  }
}

// Auth state change listener
export function onAuthStateChanged(callback: (user: any) => void) {
  return firebaseOnAuthStateChanged(auth, callback)
}

