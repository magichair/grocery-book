import type { ReactNode } from "react"
import BottomNav from "@/components/bottom-nav"

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <main className="min-h-dvh bg-slate-50 pb-16">
        {children}
      </main>
      <BottomNav />
    </>
  )
}
