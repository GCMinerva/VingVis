import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // CORS Configuration for API routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    const origin = request.headers.get('origin')

    // In production, replace with your actual domain
    // For now, allow same-origin requests only
    const allowedOrigins = [
      request.nextUrl.origin, // Same origin
      // Add other allowed origins here in production
    ]

    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
    } else if (!origin) {
      // Allow requests without origin (like from Postman, curl, or same-origin)
      response.headers.set('Access-Control-Allow-Origin', request.nextUrl.origin)
    }

    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With'
    )

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: response.headers
      })
    }

    // Add security headers for API routes
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  }

  return response
}

export const config = {
  matcher: [
    // Apply middleware to all API routes
    '/api/:path*',
  ]
}
