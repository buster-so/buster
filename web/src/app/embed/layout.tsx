import { BusterAssetsProvider } from '@/context/Assets/BusterAssetsProvider';
import { BusterReactQueryProvider } from '@/context/BusterReactQuery/BusterReactQueryAndApi';
import { BusterPosthogProvider } from '@/context/Posthog';
import { SupabaseContextProvider } from '@/context/Supabase';
import { getSupabaseUserContext } from '@/lib/supabase';

export default async function EmbedLayout({ children }: { children: React.ReactNode }) {
  const supabaseContext = await getSupabaseUserContext();

  return (
    <SupabaseContextProvider supabaseContext={supabaseContext}>
      <BusterReactQueryProvider>
        <BusterAssetsProvider>
          <BusterPosthogProvider>
            <main className="bg-background h-screen max-h-screen min-h-screen w-full">
              {children}
            </main>
          </BusterPosthogProvider>
        </BusterAssetsProvider>
      </BusterReactQueryProvider>
    </SupabaseContextProvider>
  );
}
