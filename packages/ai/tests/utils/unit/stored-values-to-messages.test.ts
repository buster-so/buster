import { describe, expect, it } from 'vitest';
import {
  createStoredValuesReasoningMessage,
  createStoredValuesToolCallMessage,
} from '../../../src/utils/memory/stored-values-to-messages';

describe('stored-values-to-messages', () => {
  describe('createStoredValuesToolCallMessage', () => {
    it('should create a user message with search results', () => {
      const searchResults = `Searched for and found these relevant values:

public.products
name [Red Bull, Monster Energy]
category [Energy Drinks]

public.stores
city [Los Angeles, San Francisco]`;

      const message = createStoredValuesToolCallMessage(searchResults);

      expect(message.role).toBe('user');
      expect(message.content).toEqual([
        {
          type: 'text',
          text: searchResults,
        },
      ]);
    });

    it('should handle empty search results', () => {
      const searchResults = '';
      const message = createStoredValuesToolCallMessage(searchResults);

      expect(message.role).toBe('user');
      expect(message.content).toEqual([
        {
          type: 'text',
          text: '',
        },
      ]);
    });

    it('should handle multiline search results correctly', () => {
      const searchResults = `Searched for and found these relevant values:

schema1.table1
col1 [value1, value2]

schema2.table2
col2 [value3]`;

      const message = createStoredValuesToolCallMessage(searchResults);

      expect(message.content[0].text).toBe(searchResults);
      expect(message.content[0].text).toContain('\n');
    });
  });

  describe('createStoredValuesReasoningMessage', () => {
    it('should create a reasoning message with search results file', () => {
      const searchResults = `Searched for and found these relevant values:

public.products
name [Red Bull, Monster Energy]`;

      const reasoningMessage = createStoredValuesReasoningMessage(searchResults);

      expect(reasoningMessage.type).toBe('files');
      expect(reasoningMessage.title).toBe('Database Values Search');
      expect(reasoningMessage.status).toBe('completed');
      expect(reasoningMessage.secondary_title).toBeUndefined();

      // Check file structure
      expect(reasoningMessage.file_ids).toHaveLength(1);
      const fileId = reasoningMessage.file_ids[0];
      expect(reasoningMessage.files[fileId]).toBeDefined();

      const file = reasoningMessage.files[fileId];
      expect(file.file_type).toBe('search-results');
      expect(file.file_name).toBe('stored-values-search');
      expect(file.version_number).toBe(1);
      expect(file.status).toBe('completed');
      expect(file.file.text).toBe(searchResults);
      expect(file.file.modified).toBeUndefined();
    });

    it('should generate unique file IDs for different calls', () => {
      const searchResults1 = 'Results 1';
      const searchResults2 = 'Results 2';

      const message1 = createStoredValuesReasoningMessage(searchResults1);
      const message2 = createStoredValuesReasoningMessage(searchResults2);

      expect(message1.id).not.toBe(message2.id);
      expect(message1.file_ids[0]).not.toBe(message2.file_ids[0]);
    });

    it('should handle empty search results in reasoning message', () => {
      const searchResults = '';
      const reasoningMessage = createStoredValuesReasoningMessage(searchResults);

      expect(reasoningMessage.type).toBe('files');
      const fileId = reasoningMessage.file_ids[0];
      expect(reasoningMessage.files[fileId].file.text).toBe('');
    });

    it('should have correct file metadata', () => {
      const searchResults = 'Test results';
      const reasoningMessage = createStoredValuesReasoningMessage(searchResults);

      const fileId = reasoningMessage.file_ids[0];
      const file = reasoningMessage.files[fileId];

      expect(file.id).toBe(fileId);
      expect(file.file_type).toBe('search-results');
      expect(file.file_name).toBe('stored-values-search');
      expect(file.version_number).toBe(1);
      expect(file.status).toBe('completed');
    });

    it('should match the expected reasoning message structure', () => {
      const searchResults = 'Test search results';
      const reasoningMessage = createStoredValuesReasoningMessage(searchResults);

      // Verify it matches the expected ChatMessageReasoningMessage type structure
      expect(reasoningMessage).toHaveProperty('id');
      expect(reasoningMessage).toHaveProperty('type', 'files');
      expect(reasoningMessage).toHaveProperty('title');
      expect(reasoningMessage).toHaveProperty('status');
      expect(reasoningMessage).toHaveProperty('secondary_title');
      expect(reasoningMessage).toHaveProperty('file_ids');
      expect(reasoningMessage).toHaveProperty('files');

      // Verify file structure
      const fileId = reasoningMessage.file_ids[0];
      const file = reasoningMessage.files[fileId];
      expect(file).toHaveProperty('id');
      expect(file).toHaveProperty('file_type');
      expect(file).toHaveProperty('file_name');
      expect(file).toHaveProperty('version_number');
      expect(file).toHaveProperty('status');
      expect(file).toHaveProperty('file');
      expect(file.file).toHaveProperty('text');
      expect(file.file).toHaveProperty('modified');
    });
  });
});
