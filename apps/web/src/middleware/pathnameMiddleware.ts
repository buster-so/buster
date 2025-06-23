import type { NextRequest, NextResponse } from 'next/server';

export async function pathnameMiddleware(request: NextRequest, response: NextResponse) {
  const pathname = request.nextUrl.pathname;
  response.headers.set('x-pathname', pathname);
  return response;
}
