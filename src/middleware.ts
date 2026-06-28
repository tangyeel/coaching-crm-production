import { NextRequest, NextResponse } from 'next/server'

const SESSION_COOKIE = 'cf-session'

const publicPrefixes = ['/login', '/signup', '/enroll', '/_next', '/favicon']
const apiPrefixes = ['/api/auth/login', '/api/auth/signup', '/api/enroll', '/api/auth/forgot-password', '/api/onboard']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = request.cookies.get(SESSION_COOKIE)?.value

  // Allow public routes
  if (publicPrefixes.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Allow auth-related API routes that don't need session
  if (apiPrefixes.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // No session → redirect to login
  if (!session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
