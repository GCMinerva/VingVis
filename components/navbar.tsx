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
  const isGuest = !user && typeof window !== 'undefined' && localStorage.getItem('guestMode') === 'true'

  const handleSignOut = async () => {
    try {
      if (isGuest) {
        localStorage.removeItem('guestMode')
        localStorage.removeItem('guestProjects')
        router.push('/')
      } else {
        await signOut()
        router.push('/')
      }
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href={user || isGuest ? "/dashboard" : "/"} className="flex items-center space-x-2">
            <span className="font-bold text-xl text-white">VingVis</span>
            {isGuest && (
              <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-500 border border-yellow-500/50">
                Guest
              </span>
            )}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {user || isGuest ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">
                    Dashboard
                  </Button>
                </Link>

                {isGuest && (
                  <Link href="/signup">
                    <Button variant="default" size="sm">
                      Create Account
                    </Button>
                  </Link>
                )}

                {user && (
                  <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-background/50 border border-border/50">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{user.email}</span>
                  </div>
                )}

                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  {isGuest ? 'Exit Guest' : 'Sign Out'}
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Log In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button variant="default" size="sm">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-background/50 transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-white" />
            ) : (
              <Menu className="h-6 w-6 text-white" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-3 border-t border-border/50">
            {user || isGuest ? (
              <>
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    Dashboard
                  </Button>
                </Link>

                {isGuest && (
                  <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="default" size="sm" className="w-full">
                      Create Account
                    </Button>
                  </Link>
                )}

                {user && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    {user.email}
                  </div>
                )}

                <Button variant="outline" size="sm" onClick={handleSignOut} className="w-full">
                  <LogOut className="h-4 w-4 mr-2" />
                  {isGuest ? 'Exit Guest' : 'Sign Out'}
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full">
                    Log In
                  </Button>
                </Link>
                <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="default" size="sm" className="w-full">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
