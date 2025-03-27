import { initializeApp, getApps } from "firebase/app"
import {
  getFirestore,
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
} from "firebase/firestore"
import { sendNotification } from "@/components/notification-provider"
import { getFirebaseConfig } from "./config"
import { createNotification } from "./notifications"

// Initialize Firebase only if it hasn't been initialized already
const app = getApps().length === 0 ? initializeApp(getFirebaseConfig()) : getApps()[0]
const db = getFirestore(app)

// Order status types
export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "returned" | "cancelled"

// Call log types
export interface CallLog {
  id: string
  date: string
  employeeId: string
  employeeName: string
  notes: string
  outcome: "successful" | "unsuccessful" | "voicemail" | "no-answer"
  followUpRequired: boolean
  followUpDate?: string
}

// Order interface
export interface Order {
  id: string
  name: string
  email: string
  phone: string
  address: string
  product: {
    id: string
    name: string
    price: number
    categoryId: string
  }
  quantity: number
  total: number
  status: OrderStatus
  source: "online" | "local"
  notes?: string
  callLogs?: CallLog[]
  assignedTo?: string
  assignedToName?: string
  createdAt: string
  createdBy?: string
  lastUpdatedAt?: string
  lastUpdatedBy?: string
  shipping?: number
  tax?: number
}

// Create a new order
export async function createOrder(orderData: Partial<Order>) {
  try {
    console.log("Creating order with data:", orderData)

    // Ensure all required fields are present
    const validatedOrderData = {
      ...orderData,
      name: orderData.name || "Unknown Customer",
      email: orderData.email || "unknown@example.com",
      phone: orderData.phone || "N/A",
      address: orderData.address || "N/A",
      product: orderData.product || { name: "Unknown Product", price: 0 },
      quantity: orderData.quantity || 1,
      total: orderData.total || orderData.product?.price * (orderData.quantity || 1),
      status: orderData.status || "pending",
      source: orderData.source || "online",
      callLogs: orderData.callLogs || [],
      createdAt: orderData.createdAt || new Date().toISOString(),
    }

    const docRef = await addDoc(collection(db, "orders"), validatedOrderData)

    console.log("Order created with ID:", docRef.id)

    // Send notification
    sendNotification(
      "New Order Received",
      `Order #${docRef.id.substring(0, 8)} has been placed by ${validatedOrderData.name}.`,
      "success",
    )

    return {
      id: docRef.id,
      ...validatedOrderData,
    }
  } catch (error) {
    console.error("Error creating order:", error)
    sendNotification("Error Creating Order", "Failed to create order. Please try again.", "error")
    throw error
  }
}

// Get all orders
export async function getOrders() {
  try {
    const ordersCollection = collection(db, "orders")
    const ordersSnapshot = await getDocs(ordersCollection)
    const orders: Order[] = []

    ordersSnapshot.forEach((doc) => {
      orders.push({
        id: doc.id,
        ...doc.data(),
      } as Order)
    })

    // Sort by createdAt in descending order
    return orders.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  } catch (error) {
    console.error("Error getting orders:", error)
    throw error
  }
}

// Get orders by status
export async function getOrdersByStatus(status: OrderStatus) {
  try {
    const q = query(collection(db, "orders"), where("status", "==", status), orderBy("createdAt", "desc"))
    const ordersSnapshot = await getDocs(q)
    const orders: Order[] = []

    ordersSnapshot.forEach((doc) => {
      orders.push({
        id: doc.id,
        ...doc.data(),
      } as Order)
    })

    return orders
  } catch (error) {
    console.error("Error getting orders by status:", error)
    throw error
  }
}

// Get orders assigned to employee
export async function getOrdersByEmployee(employeeId: string) {
  try {
    const q = query(collection(db, "orders"), where("assignedTo", "==", employeeId), orderBy("createdAt", "desc"))
    const ordersSnapshot = await getDocs(q)
    const orders: Order[] = []

    ordersSnapshot.forEach((doc) => {
      orders.push({
        id: doc.id,
        ...doc.data(),
      } as Order)
    })

    return orders
  } catch (error) {
    console.error("Error getting orders by employee:", error)
    throw error
  }
}

// Get order by ID
export async function getOrderById(orderId: string) {
  try {
    const orderDoc = await getDoc(doc(db, "orders", orderId))

    if (orderDoc.exists()) {
      return {
        id: orderDoc.id,
        ...orderDoc.data(),
      } as Order
    }

    return null
  } catch (error) {
    console.error("Error getting order:", error)
    throw error
  }
}

// Update order
export async function updateOrder(orderId: string, orderData: Partial<Order>) {
  try {
    console.log("Updating order:", orderId, "with data:", orderData)

    // Get the current order data first to ensure it exists
    const orderRef = doc(db, "orders", orderId)
    const orderDoc = await getDoc(orderRef)

    if (!orderDoc.exists()) {
      throw new Error(`Order with ID ${orderId} not found`)
    }

    const currentOrder = orderDoc.data() as Order

    // Check if status is changing from "pending" to something else
    // If so, we need to update inventory
    if (
      currentOrder.status === "pending" &&
      orderData.status &&
      orderData.status !== "pending" &&
      orderData.status !== "cancelled"
    ) {
      // Get the product and update inventory
      if (currentOrder.product?.id) {
        const productRef = doc(db, "products", currentOrder.product.id)
        const productDoc = await getDoc(productRef)

        if (productDoc.exists()) {
          const productData = productDoc.data()
          const currentInventory = productData.inventory || 0
          const orderQuantity = currentOrder.quantity || 1

          // Calculate new inventory level
          const newInventory = Math.max(0, currentInventory - orderQuantity)

          // Update product inventory
          await updateDoc(productRef, {
            inventory: newInventory,
            updatedAt: new Date().toISOString(),
            lastUpdatedBy: orderData.lastUpdatedBy || "system",
          })

          // If inventory is low, create a notification
          if (newInventory <= 10) {
            await createNotification({
              type: "low_stock",
              title: "Low Stock Alert",
              message: `Product "${productData.name}" has low stock (${newInventory} remaining)`,
              productId: currentOrder.product.id,
              severity: newInventory <= 5 ? "high" : "medium",
              createdAt: new Date().toISOString(),
              read: false,
            })
          }
        }
      }
    }

    // Handle returned or cancelled orders - add inventory back
    if (
      (orderData.status === "returned" || orderData.status === "cancelled") &&
      currentOrder.status !== "returned" &&
      currentOrder.status !== "cancelled"
    ) {
      if (currentOrder.product?.id) {
        const productRef = doc(db, "products", currentOrder.product.id)
        const productDoc = await getDoc(productRef)

        if (productDoc.exists()) {
          const productData = productDoc.data()
          const currentInventory = productData.inventory || 0
          const orderQuantity = currentOrder.quantity || 1

          // Add inventory back
          const newInventory = currentInventory + orderQuantity

          // Update product inventory
          await updateDoc(productRef, {
            inventory: newInventory,
            updatedAt: new Date().toISOString(),
            lastUpdatedBy: orderData.lastUpdatedBy || "system",
          })
        }
      }
    }

    // Proceed with update
    await updateDoc(orderRef, {
      ...orderData,
      lastUpdatedAt: new Date().toISOString(),
    })

    // Send notification
    sendNotification(
      "Order Updated",
      `Order #${orderId.substring(0, 8)} has been updated to ${orderData.status || "updated"}.`,
      "info",
    )

    return true
  } catch (error) {
    console.error("Error updating order:", error)
    sendNotification("Error Updating Order", `Failed to update order #${orderId.substring(0, 8)}.`, "error")
    throw error
  }
}

// Add call log to order
export async function addCallLogToOrder(orderId: string, callLog: Omit<CallLog, "id">) {
  try {
    const orderRef = doc(db, "orders", orderId)
    const orderDoc = await getDoc(orderRef)

    if (!orderDoc.exists()) {
      throw new Error(`Order with ID ${orderId} not found`)
    }

    const currentOrder = orderDoc.data() as Order
    const currentCallLogs = currentOrder.callLogs || []

    const newCallLog = {
      ...callLog,
      id: `call_${Date.now()}`,
    }

    const updatedCallLogs = [...currentCallLogs, newCallLog]

    await updateDoc(orderRef, {
      callLogs: updatedCallLogs,
      lastUpdatedAt: new Date().toISOString(),
      lastUpdatedBy: callLog.employeeName || "system",
    })

    return newCallLog
  } catch (error) {
    console.error("Error adding call log:", error)
    throw error
  }
}

// Assign order to employee
export async function assignOrderToEmployee(orderId: string, employeeId: string, employeeName: string) {
  try {
    const orderRef = doc(db, "orders", orderId)

    await updateDoc(orderRef, {
      assignedTo: employeeId,
      assignedToName: employeeName,
      lastUpdatedAt: new Date().toISOString(),
    })

    sendNotification(
      "Order Assigned",
      `Order #${orderId.substring(0, 8)} has been assigned to ${employeeName}.`,
      "info",
    )

    return true
  } catch (error) {
    console.error("Error assigning order:", error)
    throw error
  }
}

// Delete order
export async function deleteOrder(orderId: string) {
  try {
    const orderDoc = await getDoc(doc(db, "orders", orderId))
    const orderName = orderDoc.exists() ? `#${orderId.substring(0, 8)}` : "Unknown order"

    await deleteDoc(doc(db, "orders", orderId))

    // Send notification
    sendNotification("Order Deleted", `Order ${orderName} has been deleted.`, "info")

    return true
  } catch (error) {
    console.error("Error deleting order:", error)
    sendNotification("Error Deleting Order", `Failed to delete order #${orderId.substring(0, 8)}.`, "error")
    throw error
  }
}

