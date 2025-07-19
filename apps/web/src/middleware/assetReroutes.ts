import type { User } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import {
  BusterRoutes,
  createBusterRoute,
  getEmbedAssetRedirect,
  isPublicPage,
  isShareableAssetPage
} from '@/routes/busterRoutes';

export const assetReroutes = async (
  request: NextRequest,
  response: NextResponse,
  user: User | null
) => {
  const userExists = !!user && !!user.id;
  if (!userExists && !isPublicPage(request)) {
    const originalUrl = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    const loginUrl = new URL(createBusterRoute({ route: BusterRoutes.AUTH_LOGIN }), request.url);
    loginUrl.searchParams.set('next', encodeURIComponent(originalUrl));
    return NextResponse.redirect(loginUrl);
  }

  if (!userExists && isShareableAssetPage(request)) {
    const redirect = getEmbedAssetRedirect(request);
    if (redirect) {
      return NextResponse.redirect(new URL(redirect, request.url));
    }
    const originalUrl = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    const loginUrl = new URL(createBusterRoute({ route: BusterRoutes.AUTH_LOGIN }), request.url);
    loginUrl.searchParams.set('next', encodeURIComponent(originalUrl));
    return NextResponse.redirect(loginUrl);
  }

  return response;
};
