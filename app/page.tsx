import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, BookOpen, MessageCircle, Search } from "lucide-react"
import FeatureCard from "@/components/feature-card"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/20 to-background pt-16 pb-24 md:pt-24 md:pb-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                Welcome to MyMufti.com
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Your trusted platform for Islamic questions and scholarly answers from certified Muftis.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Link href="/auth/register">
                <Button size="lg" className="w-full">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/search">
                <Button size="lg" variant="outline" className="w-full">
                  Browse Questions
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container space-y-12 py-12 md:py-16 lg:py-24">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Platform Features</h2>
          <p className="max-w-[85%] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            MyMufti.com provides a comprehensive Islamic knowledge base with reliable scholarly responses.
          </p>
        </div>
        <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
          <FeatureCard
            icon={<MessageCircle className="h-10 w-10" />}
            title="Ask Questions"
            description="Submit your Islamic questions and receive scholarly answers from certified Muftis."
          />
          <FeatureCard
            icon={<Search className="h-10 w-10" />}
            title="Search Knowledge Base"
            description="Browse through our extensive database of previously answered questions."
          />
          <FeatureCard
            icon={<BookOpen className="h-10 w-10" />}
            title="Categorized Content"
            description="Find answers organized by topics like prayers, fasting, business ethics, and more."
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary/5 py-12 md:py-16 lg:py-20">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Ready to Get Answers?</h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl">
                Join our community today and get reliable Islamic guidance from qualified scholars.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Link href="/auth/register">
                <Button size="lg">Create an Account</Button>
              </Link>
              <Link href="/auth/login">
                <Button size="lg" variant="outline">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

