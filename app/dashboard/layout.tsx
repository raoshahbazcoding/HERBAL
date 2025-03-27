"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { LogOut, Package } from "lucide-react"
import Link from "next/link"
import { signOut } from "@/lib/firebase/auth"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !user) {
      // Redirect to login if not authenticated
      router.push("/login")
    } else if (!loading && user) {
      // Redirect based on role if trying to access wrong dashboard
      if (user.role === "admin" && !pathname.includes("/dashboard/admin")) {
        router.push("/dashboard/admin")
      } else if (user.role === "manager" && !pathname.includes("/dashboard/manager")) {
        router.push("/dashboard/manager")
      }
    }
  }, [loading, user, router, pathname])

  const handleSignOut = async () => {
    await signOut()
    router.push("/login")
  }

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Package className="h-6 w-6" />
            <span className="font-bold">ProductHub</span>
          </Link>
        </div>
        <div className="flex-1"></div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Avatar>
              <AvatarImage src="/placeholder.svg" alt={user.displayName || "User"} />
              <AvatarFallback>{user.displayName?.substring(0, 2) || user.email?.substring(0, 2) || "U"}</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm font-medium">{user.displayName || "User"}</div>
              <div className="text-xs text-muted-foreground">{user.email}</div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Log out</span>
          </Button>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}

