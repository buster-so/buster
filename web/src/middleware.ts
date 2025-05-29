import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/middleware/supabaseMiddleware';
import { assetReroutes } from './middleware/assetReroutes';
import { pathnameMiddleware } from './middleware/pathnameMiddleware';

export async function middleware(request: NextRequest) {
  try {
    let [response, user] = await updateSession(request);

    response = await pathnameMiddleware(request, response);

    response = await assetReroutes(request, response, user);

    return response;
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
