import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/middleware/supabaseMiddleware';
import { isPublicPage, BusterRoutes, createBusterRoute } from './routes';

export async function middleware(request: NextRequest) {
  try {
    const [supabaseResponse, user] = await updateSession(request);

    if ((!user || !user.id) && !isPublicPage(request)) {
      return NextResponse.redirect(
        new URL(createBusterRoute({ route: BusterRoutes.AUTH_LOGIN }), request.url)
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
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
};
