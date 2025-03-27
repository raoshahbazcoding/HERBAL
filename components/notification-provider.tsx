"use client"

import type React from "react"

import { createContext, useContext, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

type NotificationType = "success" | "error" | "info" | "warning"

interface NotificationContextType {
  notify: (title: string, description: string, type?: NotificationType) => void
}

const NotificationContext = createContext<NotificationContextType>({
  notify: () => {},
})

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast()

  const notify = (title: string, description: string, type: NotificationType = "info") => {
    const variant = type === "error" ? "destructive" : undefined

    // Limit description length to prevent UI issues
    const truncatedDescription = description.length > 200 ? `${description.substring(0, 200)}...` : description

    toast({
      title,
      description: truncatedDescription,
      variant,
      // Add duration based on type
      duration: type === "error" ? 5000 : 3000,
    })
  }

  // Listen for custom events for notifications
  useEffect(() => {
    const handleNotification = (event: CustomEvent) => {
      const { title, description, type } = event.detail
      notify(title, description, type)
    }

    window.addEventListener("app:notification" as any, handleNotification as EventListener)

    return () => {
      window.removeEventListener("app:notification" as any, handleNotification as EventListener)
    }
  }, [])

  return <NotificationContext.Provider value={{ notify }}>{children}</NotificationContext.Provider>
}

export const useNotification = () => useContext(NotificationContext)

// Helper function to trigger notifications from anywhere
export function sendNotification(title: string, description: string, type: NotificationType = "info") {
  try {
    const event = new CustomEvent("app:notification", {
      detail: { title, description, type },
    })

    window.dispatchEvent(event)
  } catch (error) {
    console.error("Failed to send notification:", error)
    // Fallback for environments where CustomEvent might not be available
    console.log(`Notification (${type}): ${title} - ${description}`)
  }
}

