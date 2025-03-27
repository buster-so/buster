import { GlobalErrorComponent } from '@/components/features/errors/GlobalErrorComponent';
import { BusterAssetsProvider } from '@/context/Assets/BusterAssetsProvider';
import { BusterReactQueryProvider } from '@/context/BusterReactQuery/BusterReactQueryAndApi';
import { BusterPosthogProvider } from '@/context/Posthog';
import { SupabaseContextProvider } from '@/context/Supabase';
import { getSupabaseUserContext } from '@/lib/supabase';

export default async function EmbedLayout({ children }: { children: React.ReactNode }) {
  const supabaseContext = await getSupabaseUserContext();

  return (
    <GlobalErrorComponent>
      <SupabaseContextProvider supabaseContext={supabaseContext}>
        <BusterReactQueryProvider>
          <BusterAssetsProvider>
            <BusterPosthogProvider>
              <main className="bg-background flex min-h-screen w-full flex-col">
                <div className="max-h-screen flex-1 overflow-hidden">{children}</div>
              </main>
            </BusterPosthogProvider>
          </BusterAssetsProvider>
        </BusterReactQueryProvider>
      </SupabaseContextProvider>
    </GlobalErrorComponent>
  );
}
