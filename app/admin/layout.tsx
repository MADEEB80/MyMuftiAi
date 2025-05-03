import type React from "react"
import { AdminSidebar } from "@/components/admin-sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { Users, BookOpen, HelpCircle, Settings, BarChart3, FileText } from "lucide-react"

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

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1">
        <div className="p-4 md:hidden">
          <MobileNav items={adminNavItems} title="Admin Panel" />
        </div>
        {children}
      </div>
    </div>
  )
}
