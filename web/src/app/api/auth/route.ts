'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerContext } from '@/context/Supabase/getSupabaseServerContext';

export async function POST(request: NextRequest) {
  const { accessToken, refreshToken, expiresAt } = await getSupabaseServerContext();

  let response = NextResponse.json({
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: expiresAt
  });

  response.cookies.set('refresh_token', refreshToken || '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax'
  });
  response.cookies.set('access_token', accessToken || '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax'
  });

  return response;
}
