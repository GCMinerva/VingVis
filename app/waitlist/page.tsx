"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function WaitlistPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to signup page
    router.replace("/signup")
  }, [router])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-white">Redirecting to signup...</p>
    </div>
  )
}
