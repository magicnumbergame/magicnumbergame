import "./globals.css"
import "./styles/custom.css"
import { Inter, Orbitron } from "next/font/google"
import type { Metadata } from "next"
import type React from "react" // Import React

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const orbitron = Orbitron({ subsets: ["latin"], variable: "--font-orbitron" })

export const metadata: Metadata = {
  title: "MNG",
  description: "Magic Number Game - A decentralized guessing game on the Ethereum blockchain",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${orbitron.variable} font-sans`}>{children}</body>
    </html>
  )
}



import './globals.css'