"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { onAuthStateChanged } from "@/lib/firebase/auth"
import { getUserById } from "@/lib/firebase/users"

interface User {
  id: string
  email: string
  displayName?: string
  role?: string
  assignedCategories?: string[]
  [key: string]: any
}

interface AuthContextType {
  user: User | null
  loading: boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    if (user?.id) {
      try {
        console.log("Refreshing user data for:", user.id)
        const refreshedUser = await getUserById(user.id)

        if (refreshedUser) {
          // Ensure staff role is updated to manager
          if (refreshedUser.role === "staff") {
            refreshedUser.role = "manager"
          }

          console.log("Refreshed user data:", {
            id: refreshedUser.id,
            role: refreshedUser.role,
            assignedCategories: refreshedUser.assignedCategories,
          })
          setUser(refreshedUser)
        } else {
          console.error("Failed to refresh user data - user not found")
        }
      } catch (error) {
        console.error("Error refreshing user data:", error)
      }
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (authUser) => {
      if (authUser) {
        try {
          // Get additional user data from Firestore
          const userData = await getUserById(authUser.uid)

          if (userData) {
            // If role is staff, update it to manager
            if (userData.role === "staff") {
              userData.role = "manager"
            }

            setUser({
              id: authUser.uid,
              email: authUser.email || "",
              ...userData,
            })
          } else {
            // If no user data in Firestore, use basic auth data
            setUser({
              id: authUser.uid,
              email: authUser.email || "",
              displayName: authUser.displayName || "",
              role: "manager", // Default to manager instead of staff
            })
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
          setUser(null)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return <AuthContext.Provider value={{ user, loading, refreshUser }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

