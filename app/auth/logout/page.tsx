"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export default function LogoutPage() {
  const { signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const performLogout = async () => {
      try {
        await signOut()
        router.push("/")
      } catch (error) {
        console.error("Error during logout:", error)
        router.push("/")
      }
    }

    performLogout()
  }, [signOut, router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Logging out...</h1>
        <p>You are being logged out. Please wait.</p>
      </div>
    </div>
  )
}
