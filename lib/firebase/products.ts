import { initializeApp, getApps } from "firebase/app"
import { getFirestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc } from "firebase/firestore"
import { sendNotification } from "@/components/notification-provider"
import { getFirebaseConfig } from "./config"

// Initialize Firebase only if it hasn't been initialized already
const app = getApps().length === 0 ? initializeApp(getFirebaseConfig()) : getApps()[0]
const db = getFirestore(app)

// Create a new product
export async function createProduct(productData: any) {
  try {
    const docRef = await addDoc(collection(db, "products"), {
      ...productData,
      createdAt: new Date().toISOString(),
    })

    // Send notification
    sendNotification("Product Created", `Product "${productData.name}" has been created successfully.`, "success")

    return {
      id: docRef.id,
      ...productData,
    }
  } catch (error) {
    console.error("Error creating product:", error)
    sendNotification("Error Creating Product", `Failed to create product "${productData.name}".`, "error")
    throw error
  }
}

// Get all products
export async function getProducts() {
  try {
    const productsSnapshot = await getDocs(collection(db, "products"))
    const products: any[] = []

    productsSnapshot.forEach((doc) => {
      // Make sure we're properly extracting all fields from the document
      const data = doc.data()
      products.push({
        id: doc.id,
        name: data.name || "Unnamed Product",
        description: data.description || "",
        price: typeof data.price === "number" ? data.price : 0,
        inventory: typeof data.inventory === "number" ? data.inventory : 0,
        categoryId: data.categoryId || "",
        imageUrl: data.imageUrl || "/placeholder.svg",
        featured: data.featured || false,
        createdAt: data.createdAt || new Date().toISOString(),
        createdBy: data.createdBy || "Unknown",
      })
    })

    // Add console logging to help debug
    console.log("Fetched products:", products)

    return products
  } catch (error) {
    console.error("Error getting products:", error)
    // Return empty array instead of throwing to prevent UI crashes
    return []
  }
}

// Get products by category
export async function getProductsByCategory(categoryId: string) {
  try {
    const productsCollection = collection(db, "products")
    const productsSnapshot = await getDocs(productsCollection)
    const products: any[] = []

    productsSnapshot.forEach((doc) => {
      const data = doc.data()
      if (data.categoryId === categoryId) {
        products.push({
          id: doc.id,
          ...data,
        })
      }
    })

    return products
  } catch (error) {
    console.error("Error getting products by category:", error)
    throw error
  }
}

// Get product by ID
export async function getProductById(productId: string) {
  try {
    const productDoc = await getDoc(doc(db, "products", productId))

    if (productDoc.exists()) {
      return {
        id: productDoc.id,
        ...productDoc.data(),
      }
    }

    return null
  } catch (error) {
    console.error("Error getting product:", error)
    throw error
  }
}

// Update product
export async function updateProduct(productId: string, productData: any) {
  try {
    await updateDoc(doc(db, "products", productId), {
      ...productData,
      updatedAt: new Date().toISOString(),
    })

    // Send notification
    sendNotification("Product Updated", `Product "${productData.name}" has been updated successfully.`, "success")

    return true
  } catch (error) {
    console.error("Error updating product:", error)
    sendNotification("Error Updating Product", `Failed to update product "${productData.name}".`, "error")
    throw error
  }
}

// Delete product
export async function deleteProduct(productId: string) {
  try {
    const productDoc = await getDoc(doc(db, "products", productId))
    const productName = productDoc.exists() ? productDoc.data().name : "Unknown product"

    await deleteDoc(doc(db, "products", productId))

    // Send notification
    sendNotification("Product Deleted", `Product "${productName}" has been deleted.`, "info")

    return true
  } catch (error) {
    console.error("Error deleting product:", error)
    sendNotification("Error Deleting Product", "Failed to delete product.", "error")
    throw error
  }
}

