'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseUserContext } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  // Parse the request body to get minutesUntilExpiration
  const body = await request.json().catch(() => ({}));
  const preemptiveRefreshMinutes = (body.preemptiveRefreshMinutes || 5) as number;

  // Get the updated user context (which will already refresh if needed)
  const { accessToken, refreshToken } = await getSupabaseUserContext(preemptiveRefreshMinutes);

  const response = NextResponse.json({
    access_token: accessToken,
    refresh_token: refreshToken
  });

  // Set cookies with the updated tokens
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
