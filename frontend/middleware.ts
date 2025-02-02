import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // RSCリクエストはスキップ
  if (request.nextUrl.search.includes('_rsc')) {
    return NextResponse.next()
  }

  const token = request.cookies.get('access_token')?.value
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                    request.nextUrl.pathname.startsWith('/register') ||
                    request.nextUrl.pathname.startsWith('/admin/login')
  const isApiRoute = request.nextUrl.pathname.startsWith('/api')
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')

  // API routes are handled separately
  if (isApiRoute) {
    return NextResponse.next()
  }

  // Redirect to login if no token and trying to access protected route
  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect to dashboard if token exists and trying to access auth pages
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
} 