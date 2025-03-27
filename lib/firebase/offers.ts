import { initializeApp, getApps } from "firebase/app"
import { getFirestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc } from "firebase/firestore"
import { getFirebaseConfig } from "./config"
import { sendNotification } from "@/components/notification-provider"

// Initialize Firebase only if it hasn't been initialized already
const app = getApps().length === 0 ? initializeApp(getFirebaseConfig()) : getApps()[0]
const db = getFirestore(app)

// Create a new offer
export async function createOffer(offerData: any) {
  try {
    const docRef = await addDoc(collection(db, "offers"), {
      ...offerData,
      createdAt: new Date().toISOString(),
    })

    sendNotification("Offer Created", `Offer "${offerData.name}" has been created successfully.`, "success")

    return {
      id: docRef.id,
      ...offerData,
    }
  } catch (error) {
    console.error("Error creating offer:", error)
    sendNotification("Error Creating Offer", `Failed to create offer "${offerData.name}".`, "error")
    throw error
  }
}

// Get all offers
export async function getOffers() {
  try {
    const offersSnapshot = await getDocs(collection(db, "offers"))
    const offers: any[] = []

    offersSnapshot.forEach((doc) => {
      offers.push({
        id: doc.id,
        ...doc.data(),
      })
    })

    // Sort by start date in descending order (newest first)
    return offers.sort((a, b) => {
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    })
  } catch (error) {
    console.error("Error getting offers:", error)
    throw error
  }
}

// Get active offers
export async function getActiveOffers() {
  try {
    const offersSnapshot = await getDocs(collection(db, "offers"))
    const offers: any[] = []
    const now = new Date()

    offersSnapshot.forEach((doc) => {
      const data = doc.data()
      const startDate = new Date(data.startDate)
      const endDate = new Date(data.endDate)

      if (startDate <= now && endDate >= now) {
        offers.push({
          id: doc.id,
          ...data,
        })
      }
    })

    return offers
  } catch (error) {
    console.error("Error getting active offers:", error)
    throw error
  }
}

// Get offer by ID
export async function getOfferById(offerId: string) {
  try {
    const offerDoc = await getDoc(doc(db, "offers", offerId))

    if (offerDoc.exists()) {
      return {
        id: offerDoc.id,
        ...offerDoc.data(),
      }
    }

    return null
  } catch (error) {
    console.error("Error getting offer:", error)
    throw error
  }
}

// Update offer
export async function updateOffer(offerId: string, offerData: any) {
  try {
    await updateDoc(doc(db, "offers", offerId), {
      ...offerData,
      updatedAt: new Date().toISOString(),
    })

    sendNotification("Offer Updated", `Offer "${offerData.name}" has been updated successfully.`, "success")

    return true
  } catch (error) {
    console.error("Error updating offer:", error)
    sendNotification("Error Updating Offer", `Failed to update offer "${offerData.name}".`, "error")
    throw error
  }
}

// Delete offer
export async function deleteOffer(offerId: string) {
  try {
    const offerDoc = await getDoc(doc(db, "offers", offerId))
    const offerName = offerDoc.exists() ? offerDoc.data().name : "Unknown offer"

    await deleteDoc(doc(db, "offers", offerId))

    sendNotification("Offer Deleted", `Offer "${offerName}" has been deleted.`, "info")

    return true
  } catch (error) {
    console.error("Error deleting offer:", error)
    sendNotification("Error Deleting Offer", "Failed to delete offer.", "error")
    throw error
  }
}

