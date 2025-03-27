import { initializeApp, getApps } from "firebase/app"
import { getFirestore, collection, doc, getDoc, getDocs, updateDoc, deleteDoc, setDoc } from "firebase/firestore"
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { getFirebaseConfig } from "./config"
import { sendNotification } from "@/components/notification-provider"

// Initialize Firebase only if it hasn't been initialized already
const app = getApps().length === 0 ? initializeApp(getFirebaseConfig()) : getApps()[0]
const db = getFirestore(app)
const auth = getAuth(app)

// Create a new user
export async function createUser(userData: any) {
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password)

    const user = userCredential.user

    // Update display name
    if (userData.displayName) {
      await updateProfile(user, {
        displayName: userData.displayName,
      })
    }

    // Store additional user data in Firestore
    await setDoc(doc(db, "users", user.uid), {
      email: userData.email,
      displayName: userData.displayName,
      role: userData.role || "manager", // Default to manager instead of staff
      assignedCategories: userData.assignedCategories || [],
      createdAt: new Date().toISOString(),
    })

    sendNotification(
      "User Created",
      `User "${userData.displayName || userData.email}" has been created successfully.`,
      "success",
    )

    return {
      id: user.uid,
      email: user.email,
      displayName: userData.displayName,
      role: userData.role || "manager",
      assignedCategories: userData.assignedCategories || [],
    }
  } catch (error) {
    console.error("Error creating user:", error)
    sendNotification(
      "Error Creating User",
      `Failed to create user "${userData.displayName || userData.email}".`,
      "error",
    )
    throw error
  }
}

// Get all users
export async function getUsers() {
  try {
    const usersSnapshot = await getDocs(collection(db, "users"))
    const users: any[] = []

    usersSnapshot.forEach((doc) => {
      const userData = doc.data()
      // If role is staff, update it to manager
      if (userData.role === "staff") {
        userData.role = "manager"
      }

      users.push({
        id: doc.id,
        ...userData,
      })
    })

    return users
  } catch (error) {
    console.error("Error getting users:", error)
    throw error
  }
}

// Get user by ID
export async function getUserById(userId: string) {
  try {
    const userDoc = await getDoc(doc(db, "users", userId))

    if (userDoc.exists()) {
      const userData = userDoc.data()
      // If role is staff, update it to manager
      if (userData.role === "staff") {
        userData.role = "manager"
      }

      return {
        id: userDoc.id,
        ...userData,
      }
    }

    return null
  } catch (error) {
    console.error("Error getting user:", error)
    throw error
  }
}

// Update user
export async function updateUser(userId: string, userData: any) {
  try {
    // If role is staff, update it to manager
    if (userData.role === "staff") {
      userData.role = "manager"
    }

    // Add a log to debug
    console.log("Updating user with role:", userData.role)

    await updateDoc(doc(db, "users", userId), {
      ...userData,
      updatedAt: new Date().toISOString(),
    })

    sendNotification(
      "User Updated",
      `User "${userData.displayName || userData.email}" has been updated successfully.`,
      "success",
    )

    return true
  } catch (error) {
    console.error("Error updating user:", error)
    sendNotification("Error Updating User", `Failed to update user.`, "error")
    throw error
  }
}

// Update user profile
export async function updateUserProfile(userId: string, profileData: any) {
  try {
    await updateDoc(doc(db, "users", userId), {
      ...profileData,
      updatedAt: new Date().toISOString(),
    })

    sendNotification("Profile Updated", "Your profile has been updated successfully.", "success")

    return true
  } catch (error) {
    console.error("Error updating user profile:", error)
    sendNotification("Error Updating Profile", "Failed to update your profile.", "error")
    throw error
  }
}

// Delete user
export async function deleteUser(userId: string) {
  try {
    const userDoc = await getDoc(doc(db, "users", userId))
    const userName = userDoc.exists() ? userDoc.data().displayName || userDoc.data().email : "Unknown user"

    await deleteDoc(doc(db, "users", userId))

    sendNotification("User Deleted", `User "${userName}" has been deleted.`, "info")

    return true
  } catch (error) {
    console.error("Error deleting user:", error)
    sendNotification("Error Deleting User", "Failed to delete user.", "error")
    throw error
  }
}

