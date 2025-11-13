import { NextRequest, NextResponse } from 'next/server'

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  })
}, 5 * 60 * 1000)

export interface RateLimitOptions {
  interval: number // Time window in milliseconds
  maxRequests: number // Maximum requests allowed in the interval
}

/**
 * Rate limiting middleware to prevent abuse
 * @param request - The Next.js request object
 * @param options - Rate limit configuration
 * @returns null if allowed, NextResponse with 429 status if rate limited
 */
export function rateLimit(
  request: NextRequest,
  options: RateLimitOptions = { interval: 60000, maxRequests: 10 }
): NextResponse | null {
  // Get IP address or use a default
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
             request.headers.get('x-real-ip') ||
             'unknown'

  const key = `${ip}:${request.nextUrl.pathname}`
  const now = Date.now()

  if (!store[key] || store[key].resetTime < now) {
    // Initialize or reset the counter
    store[key] = {
      count: 1,
      resetTime: now + options.interval,
    }
    return null // Allow the request
  }

  store[key].count++

  if (store[key].count > options.maxRequests) {
    const resetIn = Math.ceil((store[key].resetTime - now) / 1000)
    return NextResponse.json(
      {
        error: 'Too many requests. Please try again later.',
        retryAfter: resetIn
      },
      {
        status: 429,
        headers: {
          'Retry-After': resetIn.toString(),
          'X-RateLimit-Limit': options.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': store[key].resetTime.toString(),
        }
      }
    )
  }

  return null // Allow the request
}
