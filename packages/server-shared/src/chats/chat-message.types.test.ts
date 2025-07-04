import { describe, expect, it } from 'vitest';
import {
	type ChatMessage,
	type ChatMessageReasoningMessage,
	type ChatMessageReasoningMessage_Files,
	type ChatMessageReasoningMessage_Pills,
	type ChatMessageReasoningMessage_Text,
	type ChatMessageResponseMessage,
	type ChatMessageResponseMessage_File,
	type ChatMessageResponseMessage_Text,
	ChatMessageSchema,
	ReasoningMessageSchema,
	ResponseMessageSchema,
} from './chat-message.types';

describe('ResponseMessageSchema', () => {
	describe('Text Response Message', () => {
		it('should validate text response message', () => {
			const textMessage = {
				id: 'msg-1',
				type: 'text' as const,
				message: 'This is a text response',
			};

			const result = ResponseMessageSchema.parse(textMessage);
			expect(result).toEqual(textMessage);
			expect(result.type).toBe('text');
		});

		it('should validate text message with optional is_final_message', () => {
			const textMessage = {
				id: 'msg-1',
				type: 'text' as const,
				message: 'Final response',
				is_final_message: true,
			};

			const result = ResponseMessageSchema.parse(textMessage);
			expect(result.is_final_message).toBe(true);
		});

		it('should handle missing optional fields', () => {
			const textMessage = {
				id: 'msg-1',
				type: 'text' as const,
				message: 'Response without optional fields',
			};

			const result = ResponseMessageSchema.parse(textMessage);
			expect(result.is_final_message).toBeUndefined();
		});
	});

	describe('File Response Message', () => {
		it('should validate file response message', () => {
			const fileMessage = {
				id: 'file-1',
				type: 'file' as const,
				file_type: 'metric' as const,
				file_name: 'sales_metrics.yaml',
				version_number: 1,
			};

			const result = ResponseMessageSchema.parse(fileMessage);
			expect(result).toEqual(fileMessage);
			expect(result.type).toBe('file');
		});

		it('should validate all file types', () => {
			const fileTypes = ['metric', 'dashboard', 'reasoning'] as const;

			for (const fileType of fileTypes) {
				const fileMessage = {
					id: `file-${fileType}`,
					type: 'file' as const,
					file_type: fileType,
					file_name: `test_${fileType}.yaml`,
					version_number: 1,
				};

				const result = ResponseMessageSchema.parse(fileMessage);
				expect(result.file_type).toBe(fileType);
			}
		});

		it('should validate file message with optional fields', () => {
			const fileMessage = {
				id: 'file-1',
				type: 'file' as const,
				file_type: 'dashboard' as const,
				file_name: 'dashboard.yaml',
				version_number: 2,
				filter_version_id: 'filter-123',
				metadata: [
					{
						status: 'completed' as const,
						message: 'File generated successfully',
						timestamp: Date.now(),
					},
				],
			};

			const result = ResponseMessageSchema.parse(fileMessage);
			expect(result.filter_version_id).toBe('filter-123');
			expect(result.metadata).toHaveLength(1);
		});

		it('should handle null filter_version_id', () => {
			const fileMessage = {
				id: 'file-1',
				type: 'file' as const,
				file_type: 'metric' as const,
				file_name: 'metric.yaml',
				version_number: 1,
				filter_version_id: null,
			};

			const result = ResponseMessageSchema.parse(fileMessage);
			expect(result.filter_version_id).toBeNull();
		});
	});

	it('should reject invalid discriminated union types', () => {
		const invalidMessage = {
			id: 'invalid-1',
			type: 'invalid_type',
			message: 'This should fail',
		};

		expect(() => ResponseMessageSchema.parse(invalidMessage)).toThrow();
	});
});

describe('ReasoningMessageSchema', () => {
	describe('Text Reasoning Message', () => {
		it('should validate text reasoning message', () => {
			const textReasoning = {
				id: 'reasoning-1',
				type: 'text' as const,
				title: 'Analyzing Data',
				status: 'loading' as const,
			};

			const result = ReasoningMessageSchema.parse(textReasoning);
			expect(result).toEqual({ ...textReasoning, finished_reasoning: undefined });
			expect(result.type).toBe('text');
		});

		it('should validate text reasoning with all optional fields', () => {
			const textReasoning = {
				id: 'reasoning-1',
				type: 'text' as const,
				title: 'Data Analysis Complete',
				secondary_title: 'Summary of findings',
				message: 'Analysis completed successfully',
				message_chunk: 'Processing chunk 1/5',
				status: 'completed' as const,
				finished_reasoning: true,
			};

			const result = ReasoningMessageSchema.parse(textReasoning);
			expect(result.secondary_title).toBe('Summary of findings');
			expect(result.finished_reasoning).toBe(true);
		});

		it('should validate all status values', () => {
			const statusValues = ['loading', 'completed', 'failed'] as const;

			for (const status of statusValues) {
				const textReasoning = {
					id: 'reasoning-1',
					type: 'text' as const,
					title: 'Test',
					status,
				};

				const result = ReasoningMessageSchema.parse(textReasoning);
				expect(result.status).toBe(status);
			}
		});

		it('should handle null message fields', () => {
			const textReasoning = {
				id: 'reasoning-1',
				type: 'text' as const,
				title: 'Test',
				message: null,
				message_chunk: null,
				status: 'loading' as const,
			};

			const result = ReasoningMessageSchema.parse(textReasoning);
			expect(result.message).toBeNull();
			expect(result.message_chunk).toBeNull();
		});
	});

	describe('Files Reasoning Message', () => {
		it('should validate files reasoning message', () => {
			const filesReasoning = {
				id: 'reasoning-files-1',
				type: 'files' as const,
				title: 'Generated Files',
				status: 'completed' as const,
				file_ids: ['file-1', 'file-2'],
				files: {
					'file-1': {
						id: 'file-1',
						file_type: 'metric' as const,
						file_name: 'metrics.yaml',
						status: 'completed' as const,
						file: { text: 'metric content' },
					},
					'file-2': {
						id: 'file-2',
						file_type: 'dashboard' as const,
						file_name: 'dashboard.yaml',
						status: 'loading' as const,
						file: {},
					},
				},
			};

			const result = ReasoningMessageSchema.parse(filesReasoning);
			expect(result.type).toBe('files');
			expect(result.file_ids).toHaveLength(2);
			expect(result.files['file-1'].file_type).toBe('metric');
		});

		it('should validate all reasoning file types', () => {
			const fileTypes = ['metric', 'dashboard', 'reasoning', 'agent-action', 'todo'] as const;

			for (const fileType of fileTypes) {
				const filesReasoning = {
					id: 'reasoning-files-1',
					type: 'files' as const,
					title: 'Test Files',
					status: 'completed' as const,
					file_ids: [`file-${fileType}`],
					files: {
						[`file-${fileType}`]: {
							id: `file-${fileType}`,
							file_type: fileType,
							file_name: `test.${fileType}`,
							status: 'completed' as const,
							file: { text: 'content' },
						},
					},
				};

				const result = ReasoningMessageSchema.parse(filesReasoning);
				expect(result.files[`file-${fileType}`].file_type).toBe(fileType);
			}
		});

		it('should validate file with modifications', () => {
			const filesReasoning = {
				id: 'reasoning-files-1',
				type: 'files' as const,
				title: 'Modified Files',
				status: 'completed' as const,
				file_ids: ['file-1'],
				files: {
					'file-1': {
						id: 'file-1',
						file_type: 'metric' as const,
						file_name: 'modified_metrics.yaml',
						status: 'completed' as const,
						file: {
							text: 'updated content',
							modified: [
								[0, 10],
								[20, 30],
							],
						},
					},
				},
			};

			const result = ReasoningMessageSchema.parse(filesReasoning);
			expect(result.files['file-1'].file.modified).toEqual([
				[0, 10],
				[20, 30],
			]);
		});
	});

	describe('Pills Reasoning Message', () => {
		it('should validate pills reasoning message', () => {
			const pillsReasoning = {
				id: 'reasoning-pills-1',
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
							{
								text: 'Users',
								type: 'metric' as const,
								id: 'metric-2',
							},
						],
					},
				],
			};

			const result = ReasoningMessageSchema.parse(pillsReasoning);
			expect(result.type).toBe('pills');
			expect(result.pill_containers).toHaveLength(1);
			expect(result.pill_containers[0].pills).toHaveLength(2);
		});

		it('should validate all pill types', () => {
			const pillTypes = [
				'metric',
				'dashboard',
				'collection',
				'dataset',
				'term',
				'topic',
				'value',
				'empty',
			] as const;

			for (const pillType of pillTypes) {
				const pillsReasoning = {
					id: 'reasoning-pills-1',
					type: 'pills' as const,
					title: 'Test Pills',
					status: 'completed' as const,
					pill_containers: [
						{
							title: 'Test Container',
							pills: [
								{
									text: `Test ${pillType}`,
									type: pillType,
									id: `${pillType}-1`,
								},
							],
						},
					],
				};

				const result = ReasoningMessageSchema.parse(pillsReasoning);
				expect(result.pill_containers[0].pills[0].type).toBe(pillType);
			}
		});

		it('should validate multiple pill containers', () => {
			const pillsReasoning = {
				id: 'reasoning-pills-1',
				type: 'pills' as const,
				title: 'Multiple Containers',
				status: 'completed' as const,
				pill_containers: [
					{
						title: 'Metrics',
						pills: [{ text: 'Revenue', type: 'metric' as const, id: 'metric-1' }],
					},
					{
						title: 'Dashboards',
						pills: [{ text: 'Sales Dashboard', type: 'dashboard' as const, id: 'dash-1' }],
					},
				],
			};

			const result = ReasoningMessageSchema.parse(pillsReasoning);
			expect(result.pill_containers).toHaveLength(2);
			expect(result.pill_containers[0].title).toBe('Metrics');
			expect(result.pill_containers[1].title).toBe('Dashboards');
		});
	});

	it('should validate finished_reasoning field across all types', () => {
		const textWithFinished = {
			id: 'reasoning-1',
			type: 'text' as const,
			title: 'Test',
			status: 'completed' as const,
			finished_reasoning: true,
		};

		const result = ReasoningMessageSchema.parse(textWithFinished);
		expect(result.finished_reasoning).toBe(true);
	});
});

describe('ChatMessageSchema', () => {
	const baseChatMessage = {
		id: '123e4567-e89b-12d3-a456-426614174000',
		request_message: {
			request: 'Show me revenue metrics',
			sender_id: 'user-123',
			sender_name: 'John Doe',
			sender_avatar: 'https://example.com/avatar.jpg',
		},
		response_messages: {
			'resp-1': {
				id: 'resp-1',
				type: 'text' as const,
				message: 'Here are your revenue metrics',
			},
		},
		response_message_ids: ['resp-1'],
		reasoning_message_ids: ['reason-1'],
		reasoning_messages: {
			'reason-1': {
				id: 'reason-1',
				type: 'text' as const,
				title: 'Analyzing request',
				status: 'completed' as const,
			},
		},
		created_at: '2024-01-01T00:00:00Z',
		updated_at: '2024-01-01T00:00:00Z',
		final_reasoning_message: 'reason-1',
		feedback: null,
		is_completed: true,
	};

	it('should validate complete chat message', () => {
		const result = ChatMessageSchema.parse(baseChatMessage);
		expect(result).toEqual(baseChatMessage);
	});

	it('should handle null request_message', () => {
		const messageWithNullRequest = {
			...baseChatMessage,
			request_message: null,
		};

		const result = ChatMessageSchema.parse(messageWithNullRequest);
		expect(result.request_message).toBeNull();
	});

	it('should handle optional sender_avatar', () => {
		const messageWithoutAvatar = {
			...baseChatMessage,
			request_message: {
				request: 'Test request',
				sender_id: 'user-123',
				sender_name: 'John Doe',
			},
		};

		const result = ChatMessageSchema.parse(messageWithoutAvatar);
		expect(result.request_message?.sender_avatar).toBeUndefined();
	});

	it('should handle null sender_avatar', () => {
		const messageWithNullAvatar = {
			...baseChatMessage,
			request_message: {
				request: 'Test request',
				sender_id: 'user-123',
				sender_name: 'John Doe',
				sender_avatar: null,
			},
		};

		const result = ChatMessageSchema.parse(messageWithNullAvatar);
		expect(result.request_message?.sender_avatar).toBeNull();
	});

	it('should validate negative feedback', () => {
		const messageWithFeedback = {
			...baseChatMessage,
			feedback: 'negative' as const,
		};

		const result = ChatMessageSchema.parse(messageWithFeedback);
		expect(result.feedback).toBe('negative');
	});

	it('should validate complex nested structures', () => {
		const complexMessage = {
			...baseChatMessage,
			response_messages: {
				'text-1': {
					id: 'text-1',
					type: 'text' as const,
					message: 'Analysis complete',
					is_final_message: true,
				},
				'file-1': {
					id: 'file-1',
					type: 'file' as const,
					file_type: 'metric' as const,
					file_name: 'revenue_metrics.yaml',
					version_number: 1,
					metadata: [
						{
							status: 'completed' as const,
							message: 'File generated',
							timestamp: Date.now(),
						},
					],
				},
			},
			response_message_ids: ['text-1', 'file-1'],
			reasoning_messages: {
				'reason-1': {
					id: 'reason-1',
					type: 'text' as const,
					title: 'Processing request',
					status: 'completed' as const,
				},
				'reason-2': {
					id: 'reason-2',
					type: 'files' as const,
					title: 'Generated files',
					status: 'completed' as const,
					file_ids: ['gen-file-1'],
					files: {
						'gen-file-1': {
							id: 'gen-file-1',
							file_type: 'metric' as const,
							file_name: 'temp_metric.yaml',
							status: 'completed' as const,
							file: { text: 'temp content' },
						},
					},
				},
			},
			reasoning_message_ids: ['reason-1', 'reason-2'],
		};

		const result = ChatMessageSchema.parse(complexMessage);
		expect(result.response_message_ids).toHaveLength(2);
		expect(result.reasoning_message_ids).toHaveLength(2);
		expect(result.response_messages['file-1'].type).toBe('file');
		expect(result.reasoning_messages['reason-2'].type).toBe('files');
	});

	it('should require UUID format for id', () => {
		const invalidMessage = {
			...baseChatMessage,
			id: 'invalid-uuid',
		};

		expect(() => ChatMessageSchema.parse(invalidMessage)).toThrow();
	});

	it('should validate empty collections', () => {
		const messageWithEmptyCollections = {
			...baseChatMessage,
			response_messages: {},
			response_message_ids: [],
			reasoning_messages: {},
			reasoning_message_ids: [],
		};

		const result = ChatMessageSchema.parse(messageWithEmptyCollections);
		expect(result.response_message_ids).toEqual([]);
		expect(result.reasoning_message_ids).toEqual([]);
	});

	it('should have correct type inference', () => {
		const message: ChatMessage = baseChatMessage;
		expect(message.id).toBe(baseChatMessage.id);

		// Test discriminated union type inference
		const textResponse: ChatMessageResponseMessage_Text = {
			id: 'text-1',
			type: 'text',
			message: 'Text response',
		};
		expect(textResponse.type).toBe('text');

		const fileResponse: ChatMessageResponseMessage_File = {
			id: 'file-1',
			type: 'file',
			file_type: 'metric',
			file_name: 'test.yaml',
			version_number: 1,
		};
		expect(fileResponse.type).toBe('file');
	});
});
