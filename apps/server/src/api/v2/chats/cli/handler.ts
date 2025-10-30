import type { User } from '@buster/database/queries';
import type { CliChatCreateRequest, CliChatCreateResponse } from '@buster/server-shared/chats';

/**
 * Handler function for creating a CLI chat.
 *
 * TODO: Implement CLI-specific chat logic
 */
export async function createCliChatHandler(
  request: CliChatCreateRequest,
  user: User
): Promise<CliChatCreateResponse> {
  // Return a minimal response
  return {
    id: 'temp-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    title: 'CLI Chat',
    messages: {},
    created_by: user.id,
    created_by_id: user.id,
    created_by_name: user.email || 'Unknown',
    created_by_avatar: null,
    collections: [],
    individual_permissions: [],
    publicly_accessible: false,
    public_expiry_date: null,
    public_enabled_by: null,
    public_password: null,
    permission: 'owner',
    workspace_sharing: 'none',
    workspace_member_count: 0,
    message_ids: [],
    is_favorited: false,
    screenshot_taken_at: null,
    added_to_library: false,
  };
}
