import type { ReactNode } from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import PwaInstallPrompt from "@/components/pwa-install-prompt"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Grocery Book",
  description: "Track and compare unit prices across stores",
  manifest: "/manifest.json",
}

export const viewport = {
  themeColor: "#1E40AF",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <PwaInstallPrompt />
      </body>
    </html>
  )
}
