import {
  extractSimplifiedSupabaseSession,
  getSupabaseSessionServerFn,
  getSupabaseUserServerFn,
} from '@/api/server-functions/getSupabaseSession';
import { isServer } from '@/lib/window';
import { getBrowserClient } from './client';

const supabase = getBrowserClient();

export type SimplifiedSupabaseSession = {
  accessToken: string;
  isExpired: boolean;
  expiresAt: number;
  expiresIn: number;
};

export const getSupabaseSession = async (): Promise<SimplifiedSupabaseSession> => {
  const { data: sessionData, error: sessionError } = isServer
    ? await getSupabaseSessionServerFn()
    : await extractSimplifiedSupabaseSession(supabase);

  if ((!sessionData.accessToken || sessionError) && !isServer) {
    console.warn('No session data or error', sessionData, sessionError);
    return sessionData;
  }

  return sessionData;
};

export const getSupabaseUser = async () => {
  const { data: userData } = isServer
    ? await getSupabaseUserServerFn()
    : await supabase.auth.getUser();
  return userData.user;
};
