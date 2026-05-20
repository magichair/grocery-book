"use client"

import { useEffect, useState } from "react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if already installed or dismissed
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      localStorage.getItem("pwa-install-dismissed")
    ) {
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  // Expose a way for other components to trigger the prompt
  // The confirmation-sheet will call this after first price is recorded
  useEffect(() => {
    function handleShowInstall() {
      if (deferredPrompt && !dismissed) setShow(true)
    }
    window.addEventListener("grocery-book:show-install", handleShowInstall)
    return () => window.removeEventListener("grocery-book:show-install", handleShowInstall)
  }, [deferredPrompt, dismissed])

  async function handleInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === "accepted") {
      setDeferredPrompt(null)
    }
    setShow(false)
  }

  function handleDismiss() {
    setShow(false)
    setDismissed(true)
    localStorage.setItem("pwa-install-dismissed", "1")
  }

  if (!show) return null

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-black/20" onClick={handleDismiss} aria-hidden="true" />
      <div className="fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-2xl px-6 py-6">
        <div className="flex justify-center mb-4">
          <div className="w-8 h-1 bg-slate-300 rounded-full" />
        </div>
        <div className="flex items-start gap-4 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-blue-800 flex items-center justify-center shrink-0">
            <span className="text-white text-2xl font-bold">G</span>
          </div>
          <div>
            <p className="text-base font-semibold text-slate-900">Add to Home Screen</p>
            <p className="text-sm text-slate-500 mt-0.5">
              Get quick access at the store &mdash; works like a native app.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleDismiss}
            className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-medium
                       cursor-pointer hover:bg-slate-50 transition-colors min-h-[44px]"
          >
            Not now
          </button>
          <button
            onClick={handleInstall}
            className="flex-1 py-3 bg-blue-800 text-white rounded-xl text-sm font-semibold
                       cursor-pointer active:opacity-90 transition-opacity min-h-[44px]"
          >
            Install
          </button>
        </div>
      </div>
    </>
  )
}
