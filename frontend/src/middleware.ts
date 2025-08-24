import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Create the response
  const response = NextResponse.next()

  // Force override any existing CSP headers with our WebAssembly-compatible CSP
  const cspHeader = [
    "default-src 'self' 'unsafe-eval' http: https: data: blob: 'unsafe-inline'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https: data: blob:",
    "worker-src 'self' blob: data:",
    "child-src 'self' blob: data:",
    "object-src 'none'",
    "img-src 'self' data: blob: https: http:",
    "style-src 'self' 'unsafe-inline' https:",
    "font-src 'self' data: https:",
    "connect-src 'self' https: http: ws: wss:",
    "media-src 'self' blob: data:",
    "frame-src 'self'"
  ].join('; ')

  // Set CSP header with high priority
  response.headers.set('Content-Security-Policy', cspHeader)
  
  // Also set report-only for debugging
  response.headers.set('Content-Security-Policy-Report-Only', cspHeader)

  // Additional headers for WebAssembly and CORS support
  response.headers.set('Cross-Origin-Embedder-Policy', 'credentialless')
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  response.headers.set('Cross-Origin-Resource-Policy', 'cross-origin')

  // Debug header to confirm middleware is working
  response.headers.set('X-CSP-Middleware', 'active')

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * But include all admin and face-recognition routes
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    '/admin/:path*',
    '/:path*/face-recognition/:path*'
  ],
}