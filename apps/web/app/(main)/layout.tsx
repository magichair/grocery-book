import type { ReactNode } from "react"
import BottomNav from "@/components/bottom-nav"
import TopHeader from "@/components/top-header"

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <TopHeader />
      <main className="pt-14 pb-16 min-h-dvh bg-slate-50">{children}</main>
      <BottomNav />
    </>
  )
}
