import type React from "react"
import { ScholarSidebar } from "@/components/scholar-sidebar"
import { MobileNav } from "@/components/mobile-nav"

const scholarNavItems = [
  {
    title: "Dashboard",
    href: "/scholar/dashboard",
    icon: "BarChart3",
  },
  {
    title: "Assigned Questions",
    href: "/scholar/questions",
    icon: "Clock",
  },
  {
    title: "Answered Questions",
    href: "/scholar/answered",
    icon: "CheckCircle",
  },
]

export default function ScholarLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex">
      <ScholarSidebar />
      <div className="flex-1">
        <div className="p-4 md:hidden">
          <MobileNav items={scholarNavItems} title="Scholar Panel" />
        </div>
        {children}
      </div>
    </div>
  )
}
