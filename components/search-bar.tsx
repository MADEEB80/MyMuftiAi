"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

export default function SearchBar() {
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <form onSubmit={handleSearch} className="w-full">
      <div className="relative flex w-full items-center">
        <Input
          type="text"
          placeholder="Search for Islamic questions and answers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-12 h-12 text-base"
        />
        <Button type="submit" size="icon" className="absolute right-1 h-10 w-10" disabled={!searchQuery.trim()}>
          <Search className="h-5 w-5" />
          <span className="sr-only">Search</span>
        </Button>
      </div>
    </form>
  )
}
