"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { LogOut, User, Menu, X } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export function Navbar() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
      setMobileMenuOpen(false)
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-900/95 backdrop-blur-sm shadow-lg">
      <div className="w-full max-w-full px-3 sm:px-4 lg:px-6">
        <div className="flex h-14 sm:h-16 items-center justify-between gap-2 sm:gap-4">
          {/* Logo */}
          <Link
            href={user ? "/dashboard" : "/"}
            className="flex items-center flex-shrink-0"
          >
            <span className="font-bold text-lg sm:text-xl text-white hover:text-blue-400 transition-colors">
              VingVis
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3 flex-shrink-0">
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="text-zinc-300 hover:text-white hover:bg-zinc-800">
                    Dashboard
                  </Button>
                </Link>

                <div className="flex items-center gap-2 px-2 lg:px-3 py-1.5 rounded-lg bg-zinc-800/50 border border-zinc-700/50 max-w-[200px] lg:max-w-xs">
                  <User className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                  <span className="text-xs lg:text-sm text-zinc-400 truncate" title={user.email}>
                    {user.email}
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span className="hidden lg:inline">Sign Out</span>
                  <span className="lg:hidden">Out</span>
                </Button>
              </>
            ) : (
              <Link href="/waitlist">
                <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700">
                  Join Waitlist
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 flex-shrink-0"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            ) : (
              <Menu className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="py-3 space-y-2 border-t border-zinc-800">
            {user ? (
              <>
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-zinc-300 hover:text-white hover:bg-zinc-800"
                  >
                    Dashboard
                  </Button>
                </Link>

                <div className="px-3 py-2 text-sm text-zinc-400 bg-zinc-800/30 rounded-lg mx-0 truncate">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Link href="/waitlist" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="default" size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
                  Join Waitlist
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
