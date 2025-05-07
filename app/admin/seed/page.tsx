"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { seedDatabase } from "@/scripts/seed-database"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { AlertCircle, CheckCircle } from "lucide-react"

export default function SeedDatabasePage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const { user } = useAuth()
  const router = useRouter()

  // Check if user is admin
  if (user && user.role !== "admin") {
    router.push("/dashboard")
    return null
  }

  // If no user is logged in
  if (!user) {
    router.push("/auth/login")
    return null
  }

  const handleSeedDatabase = async () => {
    setLoading(true)
    try {
      const result = await seedDatabase()
      setResult(result)
    } catch (error) {
      console.error("Error seeding database:", error)
      setResult({ success: false, message: "An error occurred while seeding the database." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-10">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Seed Database</CardTitle>
          <CardDescription>
            This will add sample categories and questions to the database for testing purposes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            Warning: This action will add sample data to your database. It's designed to be safe and won't overwrite
            existing data, but it's recommended to use this only in development or testing environments.
          </p>

          {result && (
            <div
              className={`p-4 mb-4 rounded-md ${
                result.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              }`}
            >
              <div className="flex items-center">
                {result.success ? <CheckCircle className="h-5 w-5 mr-2" /> : <AlertCircle className="h-5 w-5 mr-2" />}
                <p>{result.message}</p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleSeedDatabase} disabled={loading} className="w-full">
            {loading ? "Seeding Database..." : "Seed Database"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
