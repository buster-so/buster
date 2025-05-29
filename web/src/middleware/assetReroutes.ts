import {
  BusterRoutes,
  createBusterRoute,
  getEmbedAssetRedirect,
  isPublicPage,
  isShareableAssetPage
} from '@/routes/busterRoutes';
import type { User } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';

export const assetReroutes = async (
  request: NextRequest,
  response: NextResponse,
  user: User | null
) => {
  const userExists = !!user && !!user.id;
  if (!userExists && !isPublicPage(request)) {
    return NextResponse.redirect(
      new URL(createBusterRoute({ route: BusterRoutes.AUTH_LOGIN }), request.url)
    );
  }

  if (!userExists && isShareableAssetPage(request)) {
    const redirect = getEmbedAssetRedirect(request);
    if (redirect) {
      return NextResponse.redirect(new URL(redirect, request.url));
    }
    return NextResponse.redirect(
      new URL(createBusterRoute({ route: BusterRoutes.AUTH_LOGIN }), request.url)
    );
  }

  return response;
};
