import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { AuthProvider } from "@/lib/auth-context"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

export const metadata: Metadata = {
  title: "VingVis - FTC Robot Code Builder",
  description: "Design and deploy FTC autonomous paths with VingVis drag-and-drop robotics builder.",
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
  },
  metadataBase: new URL('https://vingvis.com'),
  openGraph: {
    title: "VingVis - FTC Robot Code Builder",
    description: "Design and deploy FTC autonomous paths with VingVis drag-and-drop robotics builder.",
    images: ['/icon.svg'],
  },
  twitter: {
    card: 'summary',
    title: "VingVis - FTC Robot Code Builder",
    description: "Design and deploy FTC autonomous paths with VingVis drag-and-drop robotics builder.",
    images: ['/icon.svg'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body className="dark">
        <AuthProvider>{children}</AuthProvider>
        <Toaster />
      </body>
    </html>
  )
}
