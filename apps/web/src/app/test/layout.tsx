import { BusterReactQueryProvider } from '@/context/BusterReactQuery/BusterReactQueryAndApi';
import { SupabaseContextProvider } from '@/context/Supabase';
import { getSupabaseUserContext } from '@/lib/supabase';
import { QueryClient } from '@tanstack/react-query';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const supabaseContext = await getSupabaseUserContext();

  return (
    <SupabaseContextProvider supabaseContext={supabaseContext}>
      <BusterReactQueryProvider>{children}</BusterReactQueryProvider>
    </SupabaseContextProvider>
  );
}
