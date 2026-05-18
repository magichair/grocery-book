import type { ReactNode } from "react"
import "./globals.css"

export const metadata = {
  title: "Grocery Book",
  description: "Track and compare unit prices across stores",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
