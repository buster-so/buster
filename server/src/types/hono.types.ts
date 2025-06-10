import type { User } from '@supabase/supabase-js';

declare module 'hono' {
  interface ContextVariableMap {
    supabaseUser: User;
  }
}
