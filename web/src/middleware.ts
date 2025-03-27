import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from './middleware/supabaseMiddleware';
import { isPublicPage, BusterRoutes, createBusterRoute } from './routes';

export async function middleware(request: NextRequest) {
  try {
    const [supabaseResponse, user] = await updateSession(request);

    if ((!user || !user.id) && !isPublicPage(request)) {
      return NextResponse.redirect(
        new URL(createBusterRoute({ route: BusterRoutes.AUTH_LOGIN }), request.url)
      );
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Error in middleware:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};
