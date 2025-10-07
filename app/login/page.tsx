"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/waitlist")
  }, [router])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-8">
      <div className="max-w-md text-center space-y-3">
        <p className="text-xl font-semibold text-white">Redirecting to the waitlist…</p>
        <p className="text-sm text-zinc-400">
          Minerva/VingVis is onboarding teams in waves. Add your email to the waitlist to get beta access as soon as it’s
          available.
        </p>
      </div>
    </div>
  )
}
