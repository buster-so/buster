import type { User as BusterUser } from '@buster/database';
import type { User } from '@supabase/supabase-js';

declare module 'hono' {
  interface ContextVariableMap {
    supabaseUser: User;
    busterUser: BusterUser;
  }
}
