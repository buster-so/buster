import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from './middleware/supabaseMiddleware';
import { isPublicPage } from './middleware/publicPageMiddleware';
import { BusterRoutes, createBusterRoute } from './routes';
import { cspPolicyMiddleware } from './middleware/cspPolicyMiddleware';
import { nextPathnameMiddleware } from './middleware/nextPathnameMiddleware';

export async function middleware(request: NextRequest) {
  try {
    const [supabaseResponse, user] = await updateSession(request);
    const performUserCheck = !isPublicPage(request);
    cspPolicyMiddleware(request);
    nextPathnameMiddleware(request, supabaseResponse);
    if (performUserCheck && !user && !request.nextUrl.pathname.includes('/test/')) {
      return NextResponse.redirect(
        new URL(createBusterRoute({ route: BusterRoutes.AUTH_LOGIN }), process.env.NEXT_PUBLIC_URL)
      );
    }
    return supabaseResponse;
  } catch (error) {
    console.error('Error in middleware:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)'
  ]
};
