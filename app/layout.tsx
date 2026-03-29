import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from 'next/font/google'
import "./globals.css"
import { Providers } from "@/components/providers"

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
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.className} ${geistMono.className} antialiased bg-[#0b0b14]`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
