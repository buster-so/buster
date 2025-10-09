// Export request types and schemas
export {
  type CreateShortcutRequest,
  createShortcutRequestSchema,
  shortcutNameSchema,
  type UpdateShortcutRequest,
  updateShortcutRequestSchema,
} from './requests.types';

// Export response types and schemas
export {
  type ListShortcutsResponse,
  listShortcutsResponseSchema,
  type Shortcut,
  type ShortcutError,
  shortcutErrorSchema,
  shortcutSchema,
} from './responses.types';
