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
	type ChatWithMessages,
	ChatWithMessagesSchema,
} from './chat.types';

describe('AssetPermissionRoleSchema', () => {
	it('should validate correct permission roles', () => {
		expect(AssetPermissionRoleSchema.parse('viewer')).toBe('viewer');
		expect(AssetPermissionRoleSchema.parse('editor')).toBe('editor');
		expect(AssetPermissionRoleSchema.parse('owner')).toBe('owner');
	});

	it('should reject invalid permission roles', () => {
		expect(() => AssetPermissionRoleSchema.parse('admin')).toThrow();
		expect(() => AssetPermissionRoleSchema.parse('invalid')).toThrow();
		expect(() => AssetPermissionRoleSchema.parse('')).toThrow();
		expect(() => AssetPermissionRoleSchema.parse(null)).toThrow();
	});

	it('should have correct type inference', () => {
		const role: AssetPermissionRole = 'viewer';
		expect(role).toBe('viewer');
	});
});

describe('BusterShareIndividualSchema', () => {
	it('should validate valid individual permission objects', () => {
		const validIndividual = {
			email: 'test@example.com',
			role: 'viewer' as const,
			name: 'Test User',
		};

		const result = BusterShareIndividualSchema.parse(validIndividual);
		expect(result).toEqual(validIndividual);
	});

	it('should validate without optional name field', () => {
		const validIndividual = {
			email: 'test@example.com',
			role: 'editor' as const,
		};

		const result = BusterShareIndividualSchema.parse(validIndividual);
		expect(result).toEqual(validIndividual);
	});

	it('should reject invalid email addresses', () => {
		const invalidIndividual = {
			email: 'invalid-email',
			role: 'viewer' as const,
		};

		expect(() => BusterShareIndividualSchema.parse(invalidIndividual)).toThrow();
	});

	it('should reject invalid roles', () => {
		const invalidIndividual = {
			email: 'test@example.com',
			role: 'invalid',
		};

		expect(() => BusterShareIndividualSchema.parse(invalidIndividual)).toThrow();
	});

	it('should require email and role fields', () => {
		expect(() => BusterShareIndividualSchema.parse({})).toThrow();
		expect(() => BusterShareIndividualSchema.parse({ email: 'test@example.com' })).toThrow();
		expect(() => BusterShareIndividualSchema.parse({ role: 'viewer' })).toThrow();
	});

	it('should have correct type inference', () => {
		const individual: BusterShareIndividual = {
			email: 'test@example.com',
			role: 'owner',
			name: 'Test User',
		};
		expect(individual.email).toBe('test@example.com');
	});
});

describe('ChatWithMessagesSchema', () => {
	const baseChatData = {
		id: '123e4567-e89b-12d3-a456-426614174000',
		title: 'Test Chat',
		is_favorited: false,
		message_ids: ['msg1', 'msg2'],
		messages: {
			msg1: {
				id: '123e4567-e89b-12d3-a456-426614174001',
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
			},
		},
		created_at: '2024-01-01T00:00:00Z',
		updated_at: '2024-01-01T00:00:00Z',
		created_by: 'test-user',
		created_by_id: 'user123',
		created_by_name: 'Test User',
		created_by_avatar: 'https://example.com/avatar.png',
		publicly_accessible: false,
	};

	it('should validate valid chat with messages', () => {
		const result = ChatWithMessagesSchema.parse(baseChatData);
		expect(result).toEqual(baseChatData);
	});

	it('should handle optional fields correctly', () => {
		const chatWithOptionals = {
			...baseChatData,
			individual_permissions: [
				{
					email: 'user@example.com',
					role: 'viewer' as const,
					name: 'Shared User',
				},
			],
			public_expiry_date: '2024-12-31T23:59:59Z',
			public_enabled_by: 'admin-user',
			public_password: 'secret123',
			permission: 'editor' as const,
		};

		const result = ChatWithMessagesSchema.parse(chatWithOptionals);
		expect(result.individual_permissions).toHaveLength(1);
		expect(result.public_expiry_date).toBe('2024-12-31T23:59:59Z');
	});

	it('should handle null avatar', () => {
		const chatWithNullAvatar = {
			...baseChatData,
			created_by_avatar: null,
		};

		const result = ChatWithMessagesSchema.parse(chatWithNullAvatar);
		expect(result.created_by_avatar).toBeNull();
	});

	it('should reject invalid UUID formats', () => {
		const invalidChat = {
			...baseChatData,
			id: 'invalid-uuid',
		};

		expect(() => ChatWithMessagesSchema.parse(invalidChat)).toThrow();
	});

	it('should validate nested individual permissions', () => {
		const chatWithPermissions = {
			...baseChatData,
			individual_permissions: [
				{
					email: 'user1@example.com',
					role: 'viewer' as const,
				},
				{
					email: 'user2@example.com',
					role: 'editor' as const,
					name: 'User Two',
				},
			],
		};

		const result = ChatWithMessagesSchema.parse(chatWithPermissions);
		expect(result.individual_permissions).toHaveLength(2);
		expect(result.individual_permissions![0].email).toBe('user1@example.com');
	});

	it('should have correct type inference', () => {
		const chat: ChatWithMessages = baseChatData;
		expect(chat.id).toBe(baseChatData.id);
	});
});

describe('ChatCreateRequestSchema', () => {
	it('should validate minimal request', () => {
		const minimalRequest = {};
		const result = ChatCreateRequestSchema.parse(minimalRequest);
		expect(result).toEqual({});
	});

	it('should validate complete request with new asset fields', () => {
		const request = {
			prompt: 'Test prompt',
			chat_id: '123e4567-e89b-12d3-a456-426614174000',
			message_id: '123e4567-e89b-12d3-a456-426614174001',
			asset_id: '123e4567-e89b-12d3-a456-426614174002',
			asset_type: 'metric_file' as const,
		};

		const result = ChatCreateRequestSchema.parse(request);
		expect(result).toEqual(request);
	});

	it('should validate with legacy fields', () => {
		const legacyRequest = {
			prompt: 'Test prompt',
			metric_id: '123e4567-e89b-12d3-a456-426614174000',
			dashboard_id: '123e4567-e89b-12d3-a456-426614174001',
		};

		const result = ChatCreateRequestSchema.parse(legacyRequest);
		expect(result).toEqual(legacyRequest);
	});

	it('should require asset_type when asset_id is provided', () => {
		const invalidRequest = {
			asset_id: '123e4567-e89b-12d3-a456-426614174000',
			// Missing asset_type
		};

		expect(() => ChatCreateRequestSchema.parse(invalidRequest)).toThrow();
	});

	it('should allow asset_type without asset_id', () => {
		const validRequest = {
			asset_type: 'dashboard_file' as const,
			// No asset_id
		};

		const result = ChatCreateRequestSchema.parse(validRequest);
		expect(result.asset_type).toBe('dashboard_file');
	});

	it('should reject invalid UUID formats', () => {
		const invalidRequest = {
			chat_id: 'invalid-uuid',
		};

		expect(() => ChatCreateRequestSchema.parse(invalidRequest)).toThrow();
	});

	it('should reject invalid asset types', () => {
		const invalidRequest = {
			asset_id: '123e4567-e89b-12d3-a456-426614174000',
			asset_type: 'invalid_type',
		};

		expect(() => ChatCreateRequestSchema.parse(invalidRequest)).toThrow();
	});

	it('should have correct type inference', () => {
		const request: ChatCreateRequest = {
			prompt: 'Test',
			asset_type: 'metric_file',
		};
		expect(request.prompt).toBe('Test');
	});
});

describe('ChatCreateHandlerRequestSchema', () => {
	it('should validate handler request without legacy fields', () => {
		const handlerRequest = {
			prompt: 'Test prompt',
			chat_id: '123e4567-e89b-12d3-a456-426614174000',
			message_id: '123e4567-e89b-12d3-a456-426614174001',
			asset_id: '123e4567-e89b-12d3-a456-426614174002',
			asset_type: 'dashboard_file' as const,
		};

		const result = ChatCreateHandlerRequestSchema.parse(handlerRequest);
		expect(result).toEqual(handlerRequest);
	});

	it('should validate minimal handler request', () => {
		const minimalRequest = {};
		const result = ChatCreateHandlerRequestSchema.parse(minimalRequest);
		expect(result).toEqual({});
	});

	it('should reject legacy fields (metric_id, dashboard_id)', () => {
		const requestWithLegacy = {
			prompt: 'Test prompt',
			metric_id: '123e4567-e89b-12d3-a456-426614174000',
		};

		// This should still parse since extra fields are typically ignored in zod objects
		// unless .strict() is used, but let's verify the schema behavior
		const result = ChatCreateHandlerRequestSchema.parse(requestWithLegacy);
		expect(result.prompt).toBe('Test prompt');
		expect((result as any).metric_id).toBeUndefined();
	});

	it('should have correct type inference', () => {
		const request: ChatCreateHandlerRequest = {
			prompt: 'Test',
			asset_type: 'metric_file',
		};
		expect(request.prompt).toBe('Test');
	});
});
