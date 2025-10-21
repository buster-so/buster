import type { deploy as deployTypes } from '@buster/server-shared';
import type { GetChatsListRequest, GetChatsListResponseV2 } from '@buster/server-shared/chats';
import type {
  CreateMessageRequestBodySchema,
  CreateMessageResponse,
  GetRawMessagesResponse,
  UpdateMessageRequestBodySchema,
  UpdateMessageResponse,
} from '@buster/server-shared/message';
import { isApiKeyValid } from '../auth';
import { type SDKConfig, SDKConfigSchema } from '../config';
import { deploy } from '../deploy';
import { get, post, put } from '../http';

type UnifiedDeployRequest = deployTypes.UnifiedDeployRequest;
type UnifiedDeployResponse = deployTypes.UnifiedDeployResponse;
type CreateMessageRequest = typeof CreateMessageRequestBodySchema._type;
type UpdateMessageRequest = typeof UpdateMessageRequestBodySchema._type;

// Simplified SDK interface - only what the CLI actually uses
export interface BusterSDK {
  readonly config: SDKConfig;
  auth: {
    isApiKeyValid: (apiKey?: string) => Promise<boolean>;
  };
  deploy: (request: UnifiedDeployRequest) => Promise<UnifiedDeployResponse>;
  chats: {
    list: (params?: GetChatsListRequest) => Promise<GetChatsListResponseV2>;
  };
  messages: {
    create: (
      chatId: string,
      messageId: string,
      data: CreateMessageRequest
    ) => Promise<CreateMessageResponse>;
    update: (
      chatId: string,
      messageId: string,
      data: UpdateMessageRequest
    ) => Promise<UpdateMessageResponse>;
    getRawMessages: (chatId: string) => Promise<GetRawMessagesResponse>;
  };
}

// Create SDK instance
export function createBusterSDK(config: Partial<SDKConfig>): BusterSDK {
  // Validate config with Zod
  const validatedConfig = SDKConfigSchema.parse(config);

  return {
    config: validatedConfig,
    auth: {
      isApiKeyValid: (apiKey?: string) => isApiKeyValid(validatedConfig, apiKey),
    },
    deploy: (request) => deploy(validatedConfig, request),
    chats: {
      list: (params?: GetChatsListRequest) => {
        // Convert params to string record for HTTP client
        const queryParams = params
          ? {
              ...(params.page_token !== undefined && {
                page_token: String(params.page_token),
              }),
              ...(params.page_size !== undefined && { page_size: String(params.page_size) }),
              ...(params.chat_type !== undefined && { chat_type: params.chat_type }),
            }
          : undefined;

        return get<GetChatsListResponseV2>(validatedConfig, '/public/chats', queryParams);
      },
    },
    messages: {
      create: (chatId, messageId, data) =>
        post<CreateMessageResponse>(
          validatedConfig,
          `/public/chats/${chatId}/messages/${messageId}`,
          data
        ),
      update: (chatId, messageId, data) =>
        put<UpdateMessageResponse>(
          validatedConfig,
          `/public/chats/${chatId}/messages/${messageId}`,
          data
        ),
      getRawMessages: (chatId) =>
        get<GetRawMessagesResponse>(validatedConfig, `/public/chats/${chatId}/messages`),
    },
  };
}
