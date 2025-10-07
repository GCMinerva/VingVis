"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function SignupPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/waitlist")
  }, [router])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-8">
      <div className="max-w-md text-center space-y-3">
        <p className="text-xl font-semibold text-white">Redirecting you to the waitlist…</p>
        <p className="text-sm text-zinc-400">
          We’re onboarding Minerva/VingVis teams from the waitlist first. Add your squad and we’ll notify you when your slot
          opens.
        </p>
      </div>
    </div>
  )
}
