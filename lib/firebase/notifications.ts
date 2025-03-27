import { initializeApp, getApps } from "firebase/app"
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore"
import { getFirebaseConfig } from "./config"

// Initialize Firebase only if it hasn't been initialized already
const app = getApps().length === 0 ? initializeApp(getFirebaseConfig()) : getApps()[0]
const db = getFirestore(app)

// Create a new notification
export async function createNotification(notificationData: any) {
  try {
    const docRef = await addDoc(collection(db, "notifications"), {
      ...notificationData,
      createdAt: new Date().toISOString(),
    })

    return {
      id: docRef.id,
      ...notificationData,
    }
  } catch (error) {
    console.error("Error creating notification:", error)
    throw error
  }
}

// Get all notifications
export async function getNotifications(limit = 50) {
  try {
    const notificationsQuery = query(collection(db, "notifications"), orderBy("createdAt", "desc"), limit(limit))

    const notificationsSnapshot = await getDocs(notificationsQuery)
    const notifications: any[] = []

    notificationsSnapshot.forEach((doc) => {
      notifications.push({
        id: doc.id,
        ...doc.data(),
      })
    })

    return notifications
  } catch (error) {
    console.error("Error getting notifications:", error)
    return []
  }
}

// Get unread notifications count
export async function getUnreadNotificationsCount() {
  try {
    const unreadQuery = query(collection(db, "notifications"), where("read", "==", false))

    const snapshot = await getDocs(unreadQuery)
    return snapshot.size
  } catch (error) {
    console.error("Error getting unread notifications count:", error)
    return 0
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string) {
  try {
    await updateDoc(doc(db, "notifications", notificationId), {
      read: true,
      readAt: new Date().toISOString(),
    })
    return true
  } catch (error) {
    console.error("Error marking notification as read:", error)
    throw error
  }
}

// Mark all notifications as read
export async function markAllNotificationsAsRead() {
  try {
    const unreadQuery = query(collection(db, "notifications"), where("read", "==", false))

    const snapshot = await getDocs(unreadQuery)

    const batch = db.batch()
    snapshot.forEach((doc) => {
      batch.update(doc.ref, {
        read: true,
        readAt: new Date().toISOString(),
      })
    })

    await batch.commit()
    return true
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    throw error
  }
}

// Delete notification
export async function deleteNotification(notificationId: string) {
  try {
    await deleteDoc(doc(db, "notifications", notificationId))
    return true
  } catch (error) {
    console.error("Error deleting notification:", error)
    throw error
  }
}

