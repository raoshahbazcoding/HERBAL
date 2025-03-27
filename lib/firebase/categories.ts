import { initializeApp, getApps } from "firebase/app"
import { getFirestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc } from "firebase/firestore"
import { getFirebaseConfig } from "./config"
import { sendNotification } from "@/components/notification-provider"

// Initialize Firebase only if it hasn't been initialized already
const app = getApps().length === 0 ? initializeApp(getFirebaseConfig()) : getApps()[0]
const db = getFirestore(app)

// Create a new category
export async function createCategory(categoryData: any) {
  try {
    const docRef = await addDoc(collection(db, "categories"), {
      ...categoryData,
      createdAt: new Date().toISOString(),
    })

    sendNotification("Category Created", `Category "${categoryData.name}" has been created successfully.`, "success")

    return {
      id: docRef.id,
      ...categoryData,
    }
  } catch (error) {
    console.error("Error creating category:", error)
    sendNotification("Error Creating Category", `Failed to create category "${categoryData.name}".`, "error")
    throw error
  }
}

// Get all categories
export async function getCategories() {
  try {
    const categoriesSnapshot = await getDocs(collection(db, "categories"))
    const categories: any[] = []

    categoriesSnapshot.forEach((doc) => {
      categories.push({
        id: doc.id,
        ...doc.data(),
      })
    })

    return categories
  } catch (error) {
    console.error("Error getting categories:", error)
    throw error
  }
}

// Get category by ID
export async function getCategoryById(categoryId: string) {
  try {
    const categoryDoc = await getDoc(doc(db, "categories", categoryId))

    if (categoryDoc.exists()) {
      return {
        id: categoryDoc.id,
        ...categoryDoc.data(),
      }
    }

    return null
  } catch (error) {
    console.error("Error getting category:", error)
    throw error
  }
}

// Update category
export async function updateCategory(categoryId: string, categoryData: any) {
  try {
    await updateDoc(doc(db, "categories", categoryId), {
      ...categoryData,
      updatedAt: new Date().toISOString(),
    })

    sendNotification("Category Updated", `Category "${categoryData.name}" has been updated successfully.`, "success")

    return true
  } catch (error) {
    console.error("Error updating category:", error)
    sendNotification("Error Updating Category", `Failed to update category "${categoryData.name}".`, "error")
    throw error
  }
}

// Delete category
export async function deleteCategory(categoryId: string) {
  try {
    const categoryDoc = await getDoc(doc(db, "categories", categoryId))
    const categoryName = categoryDoc.exists() ? categoryDoc.data().name : "Unknown category"

    await deleteDoc(doc(db, "categories", categoryId))

    sendNotification("Category Deleted", `Category "${categoryName}" has been deleted.`, "info")

    return true
  } catch (error) {
    console.error("Error deleting category:", error)
    sendNotification("Error Deleting Category", "Failed to delete category.", "error")
    throw error
  }
}

