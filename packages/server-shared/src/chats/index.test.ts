import { describe, expect, it } from 'vitest';
import {
	type AssetPermissionRole,
	AssetPermissionRoleSchema,
	type BusterShareIndividual,
	BusterShareIndividualSchema,
	type ChatCreateHandlerRequest,
	ChatCreateHandlerRequestSchema,
	type ChatCreateRequest,
	ChatCreateRequestSchema,
	ChatError,
	ChatErrorCode,
	type ChatErrorResponse,
	ChatErrorResponseSchema,
	type ChatMessage,
	type ChatMessageReasoningMessage,
	type ChatMessageResponseMessage,
	ChatMessageSchema,
	type ChatWithMessages,
	ChatWithMessagesSchema,
	ReasoningMessageSchema,
	ResponseMessageSchema,
} from './index';

describe('chats index exports', () => {
	it('should export all chat.types schemas', () => {
		expect(AssetPermissionRoleSchema).toBeDefined();
		expect(BusterShareIndividualSchema).toBeDefined();
		expect(ChatWithMessagesSchema).toBeDefined();
		expect(ChatCreateRequestSchema).toBeDefined();
		expect(ChatCreateHandlerRequestSchema).toBeDefined();
	});

	it('should export all chat-errors.types', () => {
		expect(ChatErrorCode).toBeDefined();
		expect(ChatErrorResponseSchema).toBeDefined();
		expect(ChatError).toBeDefined();
	});

	it('should export all chat-message.types schemas', () => {
		expect(ChatMessageSchema).toBeDefined();
		expect(ResponseMessageSchema).toBeDefined();
		expect(ReasoningMessageSchema).toBeDefined();
	});

	it('should have working type inference', () => {
		// Test that types are properly exported
		const role: AssetPermissionRole = 'viewer';
		expect(role).toBe('viewer');

		const individual: BusterShareIndividual = {
			email: 'test@example.com',
			role: 'editor',
		};
		expect(individual.email).toBe('test@example.com');
	});

	it('should validate schemas work from chats index', () => {
		// Test AssetPermissionRoleSchema
		expect(AssetPermissionRoleSchema.parse('viewer')).toBe('viewer');
		expect(() => AssetPermissionRoleSchema.parse('invalid')).toThrow();

		// Test BusterShareIndividualSchema
		const validIndividual = {
			email: 'test@example.com',
			role: 'owner' as const,
			name: 'Test User',
		};
		expect(() => BusterShareIndividualSchema.parse(validIndividual)).not.toThrow();

		// Test ChatErrorResponseSchema
		const validErrorResponse = {
			code: 'INVALID_REQUEST',
			message: 'Test error message',
		};
		expect(() => ChatErrorResponseSchema.parse(validErrorResponse)).not.toThrow();
	});

	it('should have working ChatError class', () => {
		const error = new ChatError(ChatErrorCode.PERMISSION_DENIED, 'Access denied', 403, {
			resource: 'chat',
		});

		expect(error).toBeInstanceOf(Error);
		expect(error.code).toBe('PERMISSION_DENIED');
		expect(error.statusCode).toBe(403);
		expect(error.details).toEqual({ resource: 'chat' });

		const response = error.toResponse();
		expect(response.code).toBe('PERMISSION_DENIED');
		expect(response.message).toBe('Access denied');
		expect(response.details).toEqual({ resource: 'chat' });
	});

	it('should validate response message discriminated union', () => {
		const textMessage = {
			id: 'text-1',
			type: 'text' as const,
			message: 'Hello world',
		};

		const fileMessage = {
			id: 'file-1',
			type: 'file' as const,
			file_type: 'metric' as const,
			file_name: 'test.yaml',
			version_number: 1,
		};

		expect(() => ResponseMessageSchema.parse(textMessage)).not.toThrow();
		expect(() => ResponseMessageSchema.parse(fileMessage)).not.toThrow();
	});

	it('should validate reasoning message discriminated union', () => {
		const textReasoning = {
			id: 'reason-1',
			type: 'text' as const,
			title: 'Processing',
			status: 'loading' as const,
		};

		const filesReasoning = {
			id: 'reason-2',
			type: 'files' as const,
			title: 'Generated Files',
			status: 'completed' as const,
			file_ids: ['file-1'],
			files: {
				'file-1': {
					id: 'file-1',
					file_type: 'metric' as const,
					file_name: 'test.yaml',
					status: 'completed' as const,
					file: { text: 'content' },
				},
			},
		};

		const pillsReasoning = {
			id: 'reason-3',
			type: 'pills' as const,
			title: 'Related Items',
			status: 'completed' as const,
			pill_containers: [
				{
					title: 'Metrics',
					pills: [
						{
							text: 'Revenue',
							type: 'metric' as const,
							id: 'metric-1',
						},
					],
				},
			],
		};

		expect(() => ReasoningMessageSchema.parse(textReasoning)).not.toThrow();
		expect(() => ReasoningMessageSchema.parse(filesReasoning)).not.toThrow();
		expect(() => ReasoningMessageSchema.parse(pillsReasoning)).not.toThrow();
	});

	it('should validate complete chat message', () => {
		const chatMessage = {
			id: '123e4567-e89b-12d3-a456-426614174000',
			request_message: {
				request: 'Show me metrics',
				sender_id: 'user-123',
				sender_name: 'John Doe',
			},
			response_messages: {
				'resp-1': {
					id: 'resp-1',
					type: 'text' as const,
					message: 'Here are your metrics',
				},
			},
			response_message_ids: ['resp-1'],
			reasoning_message_ids: ['reason-1'],
			reasoning_messages: {
				'reason-1': {
					id: 'reason-1',
					type: 'text' as const,
					title: 'Processing request',
					status: 'completed' as const,
				},
			},
			created_at: '2024-01-01T00:00:00Z',
			updated_at: '2024-01-01T00:00:00Z',
			final_reasoning_message: null,
			feedback: null,
			is_completed: true,
		};

		expect(() => ChatMessageSchema.parse(chatMessage)).not.toThrow();
	});

	it('should validate chat creation requests', () => {
		const minimalRequest = {};
		expect(() => ChatCreateRequestSchema.parse(minimalRequest)).not.toThrow();

		const fullRequest = {
			prompt: 'Create a dashboard',
			chat_id: '123e4567-e89b-12d3-a456-426614174000',
			message_id: '123e4567-e89b-12d3-a456-426614174001',
			asset_id: '123e4567-e89b-12d3-a456-426614174002',
			asset_type: 'dashboard_file' as const,
		};
		expect(() => ChatCreateRequestSchema.parse(fullRequest)).not.toThrow();

		const handlerRequest = {
			prompt: 'Create a metric',
			asset_type: 'metric_file' as const,
		};
		expect(() => ChatCreateHandlerRequestSchema.parse(handlerRequest)).not.toThrow();
	});
});
