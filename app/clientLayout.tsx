"use client"

import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Providers } from "./providers"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

// Instead of loading Noto Nastaliq Urdu from Google Fonts, we'll use a system font
// or users can install the font locally

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Add a stylesheet link for Urdu font that users can install locally */}
        <style jsx global>{`
          @font-face {
            font-family: 'Urdu Font';
            src: local('Jameel Noori Nastaleeq'), local('Noto Nastaliq Urdu');
            font-weight: normal;
            font-style: normal;
          }
          
          .urdu-font {
            font-family: 'Urdu Font', 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', serif;
          }
          
          .rtl {
            direction: rtl;
            text-align: right;
          }
        `}</style>
      </head>
      <body className={inter.variable}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <Providers>
            <div className="relative flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <Toaster />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
