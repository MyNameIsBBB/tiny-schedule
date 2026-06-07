import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from './lib/jwt';

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  // Paths that should not be protected
  const isAuthPage = pathname.startsWith('/login');
  const isStaticAsset = 
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') || 
    pathname.includes('.') || 
    pathname === '/icon.png' ||
    pathname === '/logo.png';

  if (isStaticAsset) {
    return NextResponse.next();
  }

  const jwtSecret = process.env.JWT_SECRET || 'tinyschedule-super-secret-key';
  
  if (token) {
    const payload = await verifyJWT(token, jwtSecret);
    if (payload && payload.authenticated) {
      if (isAuthPage) {
        return NextResponse.redirect(new URL('/', request.url));
      }
      return NextResponse.next();
    }
  }

  if (!isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
