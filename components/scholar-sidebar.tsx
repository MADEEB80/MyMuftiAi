"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { CheckCircle, Clock, GraduationCap, Home, BarChart3, HelpCircle, LayoutDashboard } from "lucide-react"

const scholarNavItems = [
  {
    title: "Dashboard",
    href: "/scholar/dashboard",
    icon: BarChart3,
  },
  {
    title: "Assigned Questions",
    href: "/scholar/questions",
    icon: Clock,
  },
  {
    title: "Answered Questions",
    href: "/scholar/answered",
    icon: CheckCircle,
  },
]

export function ScholarSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 border-r min-h-screen p-4 hidden md:block">
      <div className="flex items-center gap-2 mb-8">
        <GraduationCap className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-bold">Scholar Panel</h2>
      </div>

      <div className="space-y-1">
        <Link
          href="/"
          className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent")}
        >
          <Home className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>

        <div className="my-4 border-t" />

        <Link
          href="/scholar/questions"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
            pathname === "/scholar/questions"
              ? "bg-accent text-accent-foreground font-medium"
              : "text-muted-foreground",
          )}
        >
          <HelpCircle className="h-4 w-4" />
          <span>Assigned Questions</span>
        </Link>
        <Link
          href="/scholar/dashboard"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
            pathname === "/scholar/dashboard"
              ? "bg-accent text-accent-foreground font-medium"
              : "text-muted-foreground",
          )}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>Dashboard</span>
        </Link>

        <Link
          href="/scholar/answered"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
            pathname === "/scholar/answered" ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground",
          )}
        >
          <CheckCircle className="h-4 w-4" />
          <span>Answered Questions</span>
        </Link>
      </div>
    </div>
  )
}
