import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from 'next/font/google'
import "./globals.css"
import { AppFooter } from "@/components/app-footer"

const geistSans = Geist({
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "BillingMate - AI-Powered Cloud Cost Optimization",
  description:
    "Reduce cloud spending by up to 40% with intelligent cost analysis, real-time monitoring, and automated recommendations. FinOps platform for AWS, Azure, and GCP.",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.className} ${geistMono.className} antialiased`}>
        <div className="flex min-h-screen flex-col">
          <main className="flex-1">{children}</main>
          <AppFooter />
        </div>
      </body>
    </html>
  )
}
