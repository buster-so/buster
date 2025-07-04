import { describe, expect, it } from 'vitest';
import {
	ChatError,
	ChatErrorCode,
	type ChatErrorResponse,
	ChatErrorResponseSchema,
} from './chat-errors.types';

describe('ChatErrorCode', () => {
	it('should have all expected error codes', () => {
		const expectedCodes = [
			'INVALID_REQUEST',
			'MISSING_ORGANIZATION',
			'UNAUTHORIZED',
			'PERMISSION_DENIED',
			'CHAT_NOT_FOUND',
			'ASSET_NOT_FOUND',
			'USER_NOT_FOUND',
			'DATABASE_ERROR',
			'TRIGGER_ERROR',
			'INTERNAL_ERROR',
		];

		for (const code of expectedCodes) {
			expect(ChatErrorCode[code as keyof typeof ChatErrorCode]).toBe(code);
		}
	});

	it('should have validation error codes', () => {
		expect(ChatErrorCode.INVALID_REQUEST).toBe('INVALID_REQUEST');
		expect(ChatErrorCode.MISSING_ORGANIZATION).toBe('MISSING_ORGANIZATION');
	});

	it('should have permission error codes', () => {
		expect(ChatErrorCode.UNAUTHORIZED).toBe('UNAUTHORIZED');
		expect(ChatErrorCode.PERMISSION_DENIED).toBe('PERMISSION_DENIED');
	});

	it('should have resource error codes', () => {
		expect(ChatErrorCode.CHAT_NOT_FOUND).toBe('CHAT_NOT_FOUND');
		expect(ChatErrorCode.ASSET_NOT_FOUND).toBe('ASSET_NOT_FOUND');
		expect(ChatErrorCode.USER_NOT_FOUND).toBe('USER_NOT_FOUND');
	});

	it('should have service error codes', () => {
		expect(ChatErrorCode.DATABASE_ERROR).toBe('DATABASE_ERROR');
		expect(ChatErrorCode.TRIGGER_ERROR).toBe('TRIGGER_ERROR');
		expect(ChatErrorCode.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
	});

	it('should be readonly (const assertion)', () => {
		// TypeScript should prevent this at compile time, but we can test the values
		expect(typeof ChatErrorCode).toBe('object');
		expect(Object.isFrozen(ChatErrorCode)).toBe(false); // const assertion doesn't freeze
	});
});

describe('ChatErrorResponseSchema', () => {
	it('should validate valid error response', () => {
		const validResponse = {
			code: 'INVALID_REQUEST',
			message: 'The request is invalid',
		};

		const result = ChatErrorResponseSchema.parse(validResponse);
		expect(result).toEqual(validResponse);
	});

	it('should validate error response with details', () => {
		const responseWithDetails = {
			code: 'PERMISSION_DENIED',
			message: 'You do not have permission to access this resource',
			details: {
				resource: 'chat',
				resourceId: '123',
				requiredPermission: 'read',
			},
		};

		const result = ChatErrorResponseSchema.parse(responseWithDetails);
		expect(result).toEqual(responseWithDetails);
	});

	it('should validate error response with complex details', () => {
		const responseWithComplexDetails = {
			code: 'DATABASE_ERROR',
			message: 'Database operation failed',
			details: {
				query: 'SELECT * FROM chats',
				error: { message: 'Connection timeout' },
				retries: 3,
				timestamp: new Date().toISOString(),
			},
		};

		const result = ChatErrorResponseSchema.parse(responseWithComplexDetails);
		expect(result.details).toEqual(responseWithComplexDetails.details);
	});

	it('should handle optional details field', () => {
		const responseWithoutDetails = {
			code: 'INTERNAL_ERROR',
			message: 'An internal error occurred',
		};

		const result = ChatErrorResponseSchema.parse(responseWithoutDetails);
		expect(result.details).toBeUndefined();
	});

	it('should require code and message fields', () => {
		expect(() => ChatErrorResponseSchema.parse({})).toThrow();
		expect(() => ChatErrorResponseSchema.parse({ code: 'INVALID_REQUEST' })).toThrow();
		expect(() => ChatErrorResponseSchema.parse({ message: 'Error message' })).toThrow();
	});

	it('should reject non-string code and message', () => {
		expect(() =>
			ChatErrorResponseSchema.parse({
				code: 123,
				message: 'Error message',
			}),
		).toThrow();

		expect(() =>
			ChatErrorResponseSchema.parse({
				code: 'INVALID_REQUEST',
				message: 123,
			}),
		).toThrow();
	});

	it('should have correct type inference', () => {
		const response: ChatErrorResponse = {
			code: 'UNAUTHORIZED',
			message: 'Authentication required',
			details: { endpoint: '/api/chat' },
		};
		expect(response.code).toBe('UNAUTHORIZED');
	});
});

describe('ChatError', () => {
	it('should create error with required parameters', () => {
		const error = new ChatError('INVALID_REQUEST', 'The request is invalid');

		expect(error).toBeInstanceOf(Error);
		expect(error).toBeInstanceOf(ChatError);
		expect(error.name).toBe('ChatError');
		expect(error.code).toBe('INVALID_REQUEST');
		expect(error.message).toBe('The request is invalid');
		expect(error.statusCode).toBe(500); // default
		expect(error.details).toBeUndefined();
	});

	it('should create error with custom status code', () => {
		const error = new ChatError('UNAUTHORIZED', 'Authentication required', 401);

		expect(error.code).toBe('UNAUTHORIZED');
		expect(error.message).toBe('Authentication required');
		expect(error.statusCode).toBe(401);
	});

	it('should create error with details', () => {
		const details = { userId: '123', resource: 'chat' };
		const error = new ChatError('PERMISSION_DENIED', 'Access denied', 403, details);

		expect(error.code).toBe('PERMISSION_DENIED');
		expect(error.message).toBe('Access denied');
		expect(error.statusCode).toBe(403);
		expect(error.details).toEqual(details);
	});

	it('should support all valid status codes', () => {
		const statusCodes = [400, 401, 403, 404, 409, 500] as const;

		for (const statusCode of statusCodes) {
			const error = new ChatError('INTERNAL_ERROR', 'Test error', statusCode);
			expect(error.statusCode).toBe(statusCode);
		}
	});

	it('should convert to response format', () => {
		const error = new ChatError('DATABASE_ERROR', 'Database connection failed', 500, {
			query: 'SELECT * FROM users',
		});

		const response = error.toResponse();

		expect(response).toEqual({
			code: 'DATABASE_ERROR',
			message: 'Database connection failed',
			details: { query: 'SELECT * FROM users' },
		});
	});

	it('should convert to response format without details', () => {
		const error = new ChatError('CHAT_NOT_FOUND', 'Chat not found', 404);

		const response = error.toResponse();

		expect(response).toEqual({
			code: 'CHAT_NOT_FOUND',
			message: 'Chat not found',
		});
		expect(response.details).toBeUndefined();
	});

	it('should maintain error stack trace', () => {
		const error = new ChatError('INTERNAL_ERROR', 'Test error');
		expect(error.stack).toBeDefined();
		expect(error.stack).toContain('ChatError');
	});

	it('should be throwable and catchable', () => {
		expect(() => {
			throw new ChatError('INVALID_REQUEST', 'Test error', 400);
		}).toThrow(ChatError);

		try {
			throw new ChatError('UNAUTHORIZED', 'Auth error', 401);
		} catch (error) {
			expect(error).toBeInstanceOf(ChatError);
			expect((error as ChatError).code).toBe('UNAUTHORIZED');
			expect((error as ChatError).statusCode).toBe(401);
		}
	});

	it('should validate response format against schema', () => {
		const error = new ChatError('TRIGGER_ERROR', 'External service error', 500, {
			service: 'trigger',
			endpoint: '/api/chat/create',
		});

		const response = error.toResponse();

		// The response should be valid according to our schema
		expect(() => ChatErrorResponseSchema.parse(response)).not.toThrow();

		const validatedResponse = ChatErrorResponseSchema.parse(response);
		expect(validatedResponse).toEqual(response);
	});
});
