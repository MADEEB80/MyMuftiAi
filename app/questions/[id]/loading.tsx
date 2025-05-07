import { Loader2 } from "lucide-react"

export default function QuestionDetailLoading() {
  return (
    <div className="container flex h-[calc(100vh-200px)] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}
