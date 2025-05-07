import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import ClientLayout from "./client-layout"

// Load Inter font
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

// Define metadata for SEO
export const metadata: Metadata = {
  title: "MyMufti.com - Islamic Q&A Platform",
  description: "Get authentic answers to your Islamic questions from qualified scholars",
  keywords: "Islam, questions, answers, fatwa, Islamic scholars, Mufti",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Add local Urdu font support */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
          @font-face {
            font-family: 'Jameel Noori Nastaleeq';
            src: url('/fonts/jameel-noori-nastaleeq.woff2') format('woff2');
            font-weight: normal;
            font-style: normal;
            font-display: swap;
          }
        `,
          }}
        />
      </head>
      <body className={inter.variable}>
        <Providers>
          <ClientLayout>{children}</ClientLayout>
        </Providers>
      </body>
    </html>
  )
}
