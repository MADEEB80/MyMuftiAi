"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

// Feature status types
type FeatureStatus = "completed" | "in-progress" | "planned"
type FeaturePriority = "high" | "medium" | "low"

interface Feature {
  id: number
  name: string
  description: string
  status: FeatureStatus
  priority: FeaturePriority
  targetDate?: string
}

export default function RoadmapPage() {
  const { user, userRole } = useAuth()
  const router = useRouter()

  const [features] = useState<Feature[]>([
    {
      id: 10,
      name: "List Questions of a User",
      description: "Allow users to view all questions they have submitted",
      status: "completed",
      priority: "high",
    },
    {
      id: 11,
      name: "List All Questions",
      description: "Admin functionality to view all questions in the system",
      status: "completed",
      priority: "high",
    },
    {
      id: 12,
      name: "List All Unanswered Questions",
      description: "Filter to show only unanswered questions",
      status: "completed",
      priority: "high",
    },
    {
      id: 13,
      name: "List All Answered Questions",
      description: "Filter to show only answered questions",
      status: "completed",
      priority: "high",
    },
    {
      id: 14,
      name: "Add Tags to Questions",
      description: "Allow adding multiple tags to questions for better categorization",
      status: "planned",
      priority: "medium",
      targetDate: "Q2 2024",
    },
    {
      id: 15,
      name: "Question Search",
      description: "Enhanced search functionality with filters and sorting",
      status: "in-progress",
      priority: "high",
      targetDate: "Q1 2024",
    },
    {
      id: 16,
      name: "Question Comments",
      description: "Allow users to comment on questions and answers",
      status: "planned",
      priority: "medium",
      targetDate: "Q2 2024",
    },
    {
      id: 17,
      name: "Answering Questions",
      description: "Scholar interface for answering questions",
      status: "completed",
      priority: "high",
    },
    {
      id: 18,
      name: "Tag Filtering",
      description: "Filter questions by tags",
      status: "planned",
      priority: "medium",
      targetDate: "Q2 2024",
    },
    {
      id: 19,
      name: "User Profile Page",
      description: "Enhanced user profile with activity history",
      status: "in-progress",
      priority: "medium",
      targetDate: "Q1 2024",
    },
    {
      id: 20,
      name: "Admin Panel",
      description: "Comprehensive admin panel for platform management",
      status: "completed",
      priority: "high",
    },
    {
      id: 21,
      name: "User Ratings for Answers",
      description: "Allow users to rate the helpfulness of answers",
      status: "planned",
      priority: "low",
      targetDate: "Q3 2024",
    },
    {
      id: 22,
      name: "Report/Flag Inappropriate Content",
      description: "Allow users to report inappropriate content",
      status: "planned",
      priority: "high",
      targetDate: "Q1 2024",
    },
    {
      id: 23,
      name: "Mobile Responsiveness",
      description: "Ensure the platform works well on mobile devices",
      status: "completed",
      priority: "high",
    },
    {
      id: 24,
      name: "SEO Optimization",
      description: "Optimize the platform for search engines",
      status: "in-progress",
      priority: "high",
      targetDate: "Q1 2024",
    },
    {
      id: 25,
      name: "Performance Optimization",
      description: "Improve loading times and overall performance",
      status: "in-progress",
      priority: "high",
      targetDate: "Q1 2024",
    },
    {
      id: 26,
      name: "Analytics Integration",
      description: "Integrate analytics to track user behavior",
      status: "planned",
      priority: "medium",
      targetDate: "Q2 2024",
    },
    {
      id: 27,
      name: "Newsletter or Updates",
      description: "Allow users to subscribe to newsletters or updates",
      status: "planned",
      priority: "low",
      targetDate: "Q3 2024",
    },
  ])

  if (!user || userRole !== "admin") {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You do not have permission to access this page.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")} className="w-full">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const completedFeatures = features.filter((f) => f.status === "completed")
  const inProgressFeatures = features.filter((f) => f.status === "in-progress")
  const plannedFeatures = features.filter((f) => f.status === "planned")

  const getStatusBadge = (status: FeatureStatus) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>
      case "in-progress":
        return <Badge className="bg-blue-500">In Progress</Badge>
      case "planned":
        return <Badge variant="outline">Planned</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: FeaturePriority) => {
    switch (priority) {
      case "high":
        return (
          <Badge variant="outline" className="border-red-500 text-red-500">
            High
          </Badge>
        )
      case "medium":
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-500">
            Medium
          </Badge>
        )
      case "low":
        return (
          <Badge variant="outline" className="border-green-500 text-green-500">
            Low
          </Badge>
        )
      default:
        return <Badge variant="outline">{priority}</Badge>
    }
  }

  return (
    <div className="container py-10">
      <div className="mb-6 flex items-center">
        <Button variant="outline" onClick={() => router.push("/admin")} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Admin
        </Button>
        <h1 className="text-3xl font-bold">Feature Roadmap</h1>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>MyMufti.com Development Roadmap</CardTitle>
          <CardDescription>Track the progress of platform features and upcoming developments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-green-500">{completedFeatures.length}</div>
              <div className="text-sm text-muted-foreground">Completed Features</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-500">{inProgressFeatures.length}</div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{plannedFeatures.length}</div>
              <div className="text-sm text-muted-foreground">Planned</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Features</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="planned">Planned</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="space-y-4">
            {features.map((feature) => (
              <Card key={feature.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">
                      {feature.id}. {feature.name}
                    </CardTitle>
                    <div className="flex gap-2">
                      {getPriorityBadge(feature.priority)}
                      {getStatusBadge(feature.status)}
                    </div>
                  </div>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {feature.targetDate && (
                    <p className="text-sm text-muted-foreground">Target completion: {feature.targetDate}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed">
          <div className="space-y-4">
            {completedFeatures.map((feature) => (
              <Card key={feature.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">
                      {feature.id}. {feature.name}
                    </CardTitle>
                    <div className="flex gap-2">
                      {getPriorityBadge(feature.priority)}
                      {getStatusBadge(feature.status)}
                    </div>
                  </div>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="in-progress">
          <div className="space-y-4">
            {inProgressFeatures.map((feature) => (
              <Card key={feature.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">
                      {feature.id}. {feature.name}
                    </CardTitle>
                    <div className="flex gap-2">
                      {getPriorityBadge(feature.priority)}
                      {getStatusBadge(feature.status)}
                    </div>
                  </div>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {feature.targetDate && (
                    <p className="text-sm text-muted-foreground">Target completion: {feature.targetDate}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="planned">
          <div className="space-y-4">
            {plannedFeatures.map((feature) => (
              <Card key={feature.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">
                      {feature.id}. {feature.name}
                    </CardTitle>
                    <div className="flex gap-2">
                      {getPriorityBadge(feature.priority)}
                      {getStatusBadge(feature.status)}
                    </div>
                  </div>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {feature.targetDate && (
                    <p className="text-sm text-muted-foreground">Target completion: {feature.targetDate}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
