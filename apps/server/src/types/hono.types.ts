import type { User as BusterUser } from '@buster/database/queries';
import type { ApiKeyContext } from '@buster/server-shared';
import type { UserOrganizationRole } from '@buster/server-shared/organization';
import type { User } from '@supabase/supabase-js';

declare module 'hono' {
  interface ContextVariableMap {
    /**
     * The Supabase cookie key. This is used to set the cookie in the browser.
     * It is the cookie that supabase uses to store the user's session.
     * We use it on the server for playwright auth setting
     */
    readonly supabaseCookieKey: string;
    /**
     * The authenticated Supabase user. This object is readonly to prevent accidental mutation.
     */
    readonly supabaseUser: User;
    /**
     * The Buster user object from the database. This object is readonly to ensure immutability.
     */
    readonly busterUser: BusterUser;
    /**
     * This is the user's organization ID and role. It is set in the requireOrganizationAdmin and requireOrganization middleware.
     * YOU MUST SET THIS IN THE MIDDLEWARE IF YOU USE THIS CONTEXT VARIABLE.
     * The object and its properties are readonly to prevent mutation.
     */
    readonly userOrganizationInfo: {
      readonly organizationId: string;
      readonly role: UserOrganizationRole;
    };

    /**
     * API key context for public API endpoints. Set by the createApiKeyAuthMiddleware.
     */
    readonly apiKey?: ApiKeyContext;
    /**
     * The access token for the user. Set by the requireAuth middleware.
     */
    readonly accessToken: string;
  }
}
