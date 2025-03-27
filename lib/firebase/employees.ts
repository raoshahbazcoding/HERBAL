import { initializeApp, getApps } from "firebase/app"
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  setDoc,
} from "firebase/firestore"
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { getFirebaseConfig } from "./config"
import { sendNotification } from "@/components/notification-provider"

// Initialize Firebase only if it hasn't been initialized already
const app = getApps().length === 0 ? initializeApp(getFirebaseConfig()) : getApps()[0]
const db = getFirestore(app)
const auth = getAuth(app)

// Employee types
export type EmployeeRole = "admin" | "manager" | "staff"

export interface EmployeePermissions {
  canCreateOrders: boolean
  canUpdateOrders: boolean
  canViewProducts: boolean
  canUpdateProducts: boolean
  canManageOffers: boolean
  canViewReports: boolean
}

export interface Employee {
  id: string
  email: string
  displayName?: string
  firstName?: string
  lastName?: string
  role: EmployeeRole
  permissions: EmployeePermissions
  assignedCategories: string[]
  assignedProducts: string[]
  phoneNumber?: string
  department?: string
  hireDate?: string
  status: "active" | "inactive"
  createdAt: string
  createdBy?: string
  updatedAt?: string
  updatedBy?: string
}

// Create a new employee
export async function createEmployee(employeeData: Partial<Employee> & { password: string }) {
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, employeeData.email!, employeeData.password)
    const user = userCredential.user

    // Update display name
    if (employeeData.displayName) {
      await updateProfile(user, {
        displayName: employeeData.displayName,
      })
    }

    // Set default permissions based on role
    const defaultPermissions: EmployeePermissions = {
      canCreateOrders: employeeData.role === "admin" || employeeData.role === "manager",
      canUpdateOrders: employeeData.role === "admin" || employeeData.role === "manager",
      canViewProducts: employeeData.role === "admin" || employeeData.role === "manager",
      canUpdateProducts: employeeData.role === "admin",
      canManageOffers: employeeData.role === "admin",
      canViewReports: employeeData.role === "admin" || employeeData.role === "manager",
    }

    // Store employee data in Firestore
    const employeeDoc = {
      email: employeeData.email,
      displayName: employeeData.displayName || `${employeeData.firstName || ""} ${employeeData.lastName || ""}`.trim(),
      firstName: employeeData.firstName || "",
      lastName: employeeData.lastName || "",
      role: employeeData.role || "staff",
      permissions: employeeData.permissions || defaultPermissions,
      assignedCategories: employeeData.assignedCategories || [],
      assignedProducts: employeeData.assignedProducts || [],
      phoneNumber: employeeData.phoneNumber || "",
      department: employeeData.department || "",
      hireDate: employeeData.hireDate || new Date().toISOString().split("T")[0],
      status: employeeData.status || "active",
      createdAt: new Date().toISOString(),
      createdBy: employeeData.createdBy || "system",
    }

    await setDoc(doc(db, "employees", user.uid), employeeDoc)

    sendNotification(
      "Employee Created",
      `Employee "${employeeData.displayName || employeeData.email}" has been created successfully.`,
      "success",
    )

    return {
      id: user.uid,
      ...employeeDoc,
    }
  } catch (error) {
    console.error("Error creating employee:", error)
    sendNotification(
      "Error Creating Employee",
      `Failed to create employee "${employeeData.displayName || employeeData.email}".`,
      "error",
    )
    throw error
  }
}

// Get all employees
export async function getEmployees() {
  try {
    const employeesSnapshot = await getDocs(collection(db, "employees"))
    const employees: Employee[] = []

    employeesSnapshot.forEach((doc) => {
      employees.push({
        id: doc.id,
        ...doc.data(),
      } as Employee)
    })

    return employees
  } catch (error) {
    console.error("Error getting employees:", error)
    throw error
  }
}

// Get employees by role
export async function getEmployeesByRole(role: EmployeeRole) {
  try {
    const q = query(collection(db, "employees"), where("role", "==", role))
    const employeesSnapshot = await getDocs(q)
    const employees: Employee[] = []

    employeesSnapshot.forEach((doc) => {
      employees.push({
        id: doc.id,
        ...doc.data(),
      } as Employee)
    })

    return employees
  } catch (error) {
    console.error("Error getting employees by role:", error)
    throw error
  }
}

// Get employees by assigned category
export async function getEmployeesByCategory(categoryId: string) {
  try {
    const q = query(collection(db, "employees"), where("assignedCategories", "array-contains", categoryId))
    const employeesSnapshot = await getDocs(q)
    const employees: Employee[] = []

    employeesSnapshot.forEach((doc) => {
      employees.push({
        id: doc.id,
        ...doc.data(),
      } as Employee)
    })

    return employees
  } catch (error) {
    console.error("Error getting employees by category:", error)
    throw error
  }
}

// Get employees by assigned product
export async function getEmployeesByProduct(productId: string) {
  try {
    const q = query(collection(db, "employees"), where("assignedProducts", "array-contains", productId))
    const employeesSnapshot = await getDocs(q)
    const employees: Employee[] = []

    employeesSnapshot.forEach((doc) => {
      employees.push({
        id: doc.id,
        ...doc.data(),
      } as Employee)
    })

    return employees
  } catch (error) {
    console.error("Error getting employees by product:", error)
    throw error
  }
}

// Get employee by ID
export async function getEmployeeById(employeeId: string) {
  try {
    const employeeDoc = await getDoc(doc(db, "employees", employeeId))

    if (employeeDoc.exists()) {
      return {
        id: employeeDoc.id,
        ...employeeDoc.data(),
      } as Employee
    }

    return null
  } catch (error) {
    console.error("Error getting employee:", error)
    throw error
  }
}

// Update employee
export async function updateEmployee(employeeId: string, employeeData: Partial<Employee>) {
  try {
    await updateDoc(doc(db, "employees", employeeId), {
      ...employeeData,
      updatedAt: new Date().toISOString(),
    })

    sendNotification(
      "Employee Updated",
      `Employee "${employeeData.displayName || employeeData.email}" has been updated successfully.`,
      "success",
    )

    return true
  } catch (error) {
    console.error("Error updating employee:", error)
    sendNotification("Error Updating Employee", `Failed to update employee.`, "error")
    throw error
  }
}

// Delete employee
export async function deleteEmployee(employeeId: string) {
  try {
    const employeeDoc = await getDoc(doc(db, "employees", employeeId))
    const employeeName = employeeDoc.exists()
      ? employeeDoc.data().displayName || employeeDoc.data().email
      : "Unknown employee"

    await deleteDoc(doc(db, "employees", employeeId))

    sendNotification("Employee Deleted", `Employee "${employeeName}" has been deleted.`, "info")

    return true
  } catch (error) {
    console.error("Error deleting employee:", error)
    sendNotification("Error Deleting Employee", "Failed to delete employee.", "error")
    throw error
  }
}

// Assign categories to employee
export async function assignCategoriesToEmployee(employeeId: string, categoryIds: string[]) {
  try {
    const employeeDoc = await getDoc(doc(db, "employees", employeeId))

    if (!employeeDoc.exists()) {
      throw new Error("Employee not found")
    }

    const currentCategories = employeeDoc.data().assignedCategories || []
    const updatedCategories = [...new Set([...currentCategories, ...categoryIds])]

    await updateDoc(doc(db, "employees", employeeId), {
      assignedCategories: updatedCategories,
      updatedAt: new Date().toISOString(),
    })

    return true
  } catch (error) {
    console.error("Error assigning categories:", error)
    throw error
  }
}

// Assign products to employee
export async function assignProductsToEmployee(employeeId: string, productIds: string[]) {
  try {
    const employeeDoc = await getDoc(doc(db, "employees", employeeId))

    if (!employeeDoc.exists()) {
      throw new Error("Employee not found")
    }

    const currentProducts = employeeDoc.data().assignedProducts || []
    const updatedProducts = [...new Set([...currentProducts, ...productIds])]

    await updateDoc(doc(db, "employees", employeeId), {
      assignedProducts: updatedProducts,
      updatedAt: new Date().toISOString(),
    })

    return true
  } catch (error) {
    console.error("Error assigning products:", error)
    throw error
  }
}

// Remove categories from employee
export async function removeCategoriesFromEmployee(employeeId: string, categoryIds: string[]) {
  try {
    const employeeDoc = await getDoc(doc(db, "employees", employeeId))

    if (!employeeDoc.exists()) {
      throw new Error("Employee not found")
    }

    const currentCategories = employeeDoc.data().assignedCategories || []
    const updatedCategories = currentCategories.filter((id) => !categoryIds.includes(id))

    await updateDoc(doc(db, "employees", employeeId), {
      assignedCategories: updatedCategories,
      updatedAt: new Date().toISOString(),
    })

    return true
  } catch (error) {
    console.error("Error removing categories:", error)
    throw error
  }
}

// Remove products from employee
export async function removeProductsFromEmployee(employeeId: string, productIds: string[]) {
  try {
    const employeeDoc = await getDoc(doc(db, "employees", employeeId))

    if (!employeeDoc.exists()) {
      throw new Error("Employee not found")
    }

    const currentProducts = employeeDoc.data().assignedProducts || []
    const updatedProducts = currentProducts.filter((id) => !productIds.includes(id))

    await updateDoc(doc(db, "employees", employeeId), {
      assignedProducts: updatedProducts,
      updatedAt: new Date().toISOString(),
    })

    return true
  } catch (error) {
    console.error("Error removing products:", error)
    throw error
  }
}

