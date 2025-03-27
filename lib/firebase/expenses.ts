import { initializeApp, getApps } from "firebase/app"
import { getFirestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc } from "firebase/firestore"
import { getFirebaseConfig } from "./config"
import { sendNotification } from "@/components/notification-provider"

// Initialize Firebase only if it hasn't been initialized already
const app = getApps().length === 0 ? initializeApp(getFirebaseConfig()) : getApps()[0]
const db = getFirestore(app)

// Create a new expense
export async function createExpense(expenseData: any) {
  try {
    const docRef = await addDoc(collection(db, "expenses"), {
      ...expenseData,
      createdAt: new Date().toISOString(),
    })

    sendNotification("Expense Created", `Expense "${expenseData.name}" has been created successfully.`, "success")

    return {
      id: docRef.id,
      ...expenseData,
    }
  } catch (error) {
    console.error("Error creating expense:", error)
    sendNotification("Error Creating Expense", `Failed to create expense "${expenseData.name}".`, "error")
    throw error
  }
}

// Get all expenses
export async function getExpenses() {
  try {
    const expensesSnapshot = await getDocs(collection(db, "expenses"))
    const expenses: any[] = []

    expensesSnapshot.forEach((doc) => {
      expenses.push({
        id: doc.id,
        ...doc.data(),
      })
    })

    // Sort by date in descending order
    return expenses.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })
  } catch (error) {
    console.error("Error getting expenses:", error)
    return []
  }
}

// Get expense by ID
export async function getExpenseById(expenseId: string) {
  try {
    const expenseDoc = await getDoc(doc(db, "expenses", expenseId))

    if (expenseDoc.exists()) {
      return {
        id: expenseDoc.id,
        ...expenseDoc.data(),
      }
    }

    return null
  } catch (error) {
    console.error("Error getting expense:", error)
    throw error
  }
}

// Update expense
export async function updateExpense(expenseId: string, expenseData: any) {
  try {
    await updateDoc(doc(db, "expenses", expenseId), {
      ...expenseData,
      updatedAt: new Date().toISOString(),
    })

    sendNotification("Expense Updated", `Expense "${expenseData.name}" has been updated successfully.`, "success")

    return true
  } catch (error) {
    console.error("Error updating expense:", error)
    sendNotification("Error Updating Expense", `Failed to update expense "${expenseData.name}".`, "error")
    throw error
  }
}

// Delete expense
export async function deleteExpense(expenseId: string) {
  try {
    const expenseDoc = await getDoc(doc(db, "expenses", expenseId))
    const expenseName = expenseDoc.exists() ? expenseDoc.data().name : "Unknown expense"

    await deleteDoc(doc(db, "expenses", expenseId))

    sendNotification("Expense Deleted", `Expense "${expenseName}" has been deleted.`, "info")

    return true
  } catch (error) {
    console.error("Error deleting expense:", error)
    sendNotification("Error Deleting Expense", "Failed to delete expense.", "error")
    throw error
  }
}

