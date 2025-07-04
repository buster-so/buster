import { describe, expect, it } from 'vitest';
import {
	AssetPermissionRoleSchema,
	BusterShareIndividualSchema,
	ChatCreateHandlerRequestSchema,
	ChatCreateRequestSchema,
	ChatError,
	ChatErrorCode,
	ChatErrorResponseSchema,
	ChatMessageSchema,
	ChatWithMessagesSchema,
	ReasoningMessageSchema,
	ResponseMessageSchema,
} from './index';

describe('server-shared main index exports', () => {
	it('should export all chat types', () => {
		// Check that chat-related exports are available
		expect(AssetPermissionRoleSchema).toBeDefined();
		expect(BusterShareIndividualSchema).toBeDefined();
		expect(ChatWithMessagesSchema).toBeDefined();
		expect(ChatCreateRequestSchema).toBeDefined();
		expect(ChatCreateHandlerRequestSchema).toBeDefined();
	});

	it('should export chat error types', () => {
		expect(ChatErrorCode).toBeDefined();
		expect(ChatErrorResponseSchema).toBeDefined();
		expect(ChatError).toBeDefined();
	});

	it('should export chat message types', () => {
		expect(ChatMessageSchema).toBeDefined();
		expect(ResponseMessageSchema).toBeDefined();
		expect(ReasoningMessageSchema).toBeDefined();
	});

	it('should have working schema validation from exports', () => {
		expect(AssetPermissionRoleSchema.parse('viewer')).toBe('viewer');
		expect(AssetPermissionRoleSchema.parse('editor')).toBe('editor');
		expect(AssetPermissionRoleSchema.parse('owner')).toBe('owner');
	});

	it('should have working ChatError class from exports', () => {
		const error = new ChatError(ChatErrorCode.INVALID_REQUEST, 'Test error');
		expect(error).toBeInstanceOf(Error);
		expect(error.code).toBe('INVALID_REQUEST');
		expect(error.message).toBe('Test error');
	});

	it('should validate chat message schema works', () => {
		const validMessage = {
			id: '123e4567-e89b-12d3-a456-426614174000',
			request_message: null,
			response_messages: {},
			response_message_ids: [],
			reasoning_message_ids: [],
			reasoning_messages: {},
			created_at: '2024-01-01T00:00:00Z',
			updated_at: '2024-01-01T00:00:00Z',
			final_reasoning_message: null,
			feedback: null,
			is_completed: true,
		};

		expect(() => ChatMessageSchema.parse(validMessage)).not.toThrow();
	});

	it('should validate response message schema works', () => {
		const textMessage = {
			id: 'msg-1',
			type: 'text' as const,
			message: 'Test response',
		};

		expect(() => ResponseMessageSchema.parse(textMessage)).not.toThrow();
	});

	it('should validate reasoning message schema works', () => {
		const reasoningMessage = {
			id: 'reasoning-1',
			type: 'text' as const,
			title: 'Test reasoning',
			status: 'completed' as const,
		};

		expect(() => ReasoningMessageSchema.parse(reasoningMessage)).not.toThrow();
	});
});
