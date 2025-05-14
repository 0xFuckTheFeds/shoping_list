import type React from "react"
import type { Metadata } from "next"
import { Inter, Bangers } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const bangers = Bangers({ weight: "400", subsets: ["latin"], variable: "--font-bangers" })

export const metadata: Metadata = {
  title: "Dashcoin - Cryptocurrency Dashboard",
  description: "Track Dashcoin and other cryptocurrency metrics and statistics",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${bangers.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
