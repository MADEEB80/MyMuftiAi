"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export default function AdminPage() {
  const router = useRouter()
  const { user, userRole, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (user && userRole === "admin") {
        // Redirect to admin dashboard
        router.push("/admin/dashboard")
      } else {
        // Redirect to home if not admin
        router.push("/")
      }
    }
  }, [user, userRole, loading, router])

  return (
    <div className="container flex h-[calc(100vh-200px)] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}
