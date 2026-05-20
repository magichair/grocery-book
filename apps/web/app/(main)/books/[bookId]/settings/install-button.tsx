"use client"

import { Smartphone, ChevronRight } from "lucide-react"

export default function InstallButton() {
  function handleInstall() {
    window.dispatchEvent(new Event("grocery-book:show-install"))
  }

  return (
    <button
      onClick={handleInstall}
      className="flex items-center w-full px-4 py-3.5 min-h-[52px] border-t border-slate-100
                 cursor-pointer hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
    >
      <Smartphone className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
      <span className="flex-1 text-sm font-medium text-slate-900">Install app</span>
      <ChevronRight className="w-4 h-4 text-slate-300" />
    </button>
  )
}
