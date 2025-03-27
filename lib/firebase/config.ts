// Firebase configuration
export function getFirebaseConfig() {
  // Check if all required environment variables are present
  const requiredEnvVars = [
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID",
  ]

  const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName])

  if (missingEnvVars.length > 0) {
    console.warn(`Missing Firebase environment variables: ${missingEnvVars.join(", ")}. Using fallback values.`)
  }

  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDcDT6v2jBcQNMjuBqROJiggyD8dBmqZ-E",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "usermangement-software.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "usermangement-software",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "usermangement-software.appspot.com",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "745801362001",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:745801362001:web:be6829abbde0953fef2670",
  }
}

