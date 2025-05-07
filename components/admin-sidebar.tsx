"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Users, BookOpen, HelpCircle, Settings, BarChart3, Home, ShieldCheck, FileText } from "lucide-react"

const adminNavItems = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: BarChart3,
  },
  {
    title: "Questions",
    href: "/admin/questions",
    icon: HelpCircle,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Categories",
    href: "/admin/categories",
    icon: BookOpen,
  },
  {
    title: "Role Requests",
    href: "/admin/role-requests",
    icon: FileText,
  },
  {
    title: "Roadmap",
    href: "/admin/roadmap",
    icon: Settings,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 border-r min-h-screen p-4 hidden md:block">
      <div className="flex items-center gap-2 mb-8">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-bold">Admin Panel</h2>
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

        {adminNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
              pathname === item.href ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground",
            )}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.title}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
