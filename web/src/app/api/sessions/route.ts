import { createClient } from '@/context/Supabase/server';
import { useSupabaseServerContext } from '@/context/Supabase/useSupabaseContext';
import { Langfuse } from 'langfuse';
import { NextRequest, NextResponse } from 'next/server';

const langfuse = new Langfuse({
  secretKey: process.env.NEXT_PRIVATE_LANGFUSE_SECRET_KEY,
  publicKey: process.env.NEXT_PRIVATE_LANGFUSE_PUBLIC_KEY,
  baseUrl: 'https://us.cloud.langfuse.com'
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  const { user } = await useSupabaseServerContext();

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 });
  }

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: organizationData, error: organizationError } = await supabase
    .from('users_to_organizations')
    .select('*')
    .eq('user_id', user.id)
    .single();

  const isBusterDomain = true;

  try {
    const session = await langfuse.api.sessionsGet(sessionId);
    return new Response(JSON.stringify({ session }));
  } catch (error) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }
}
