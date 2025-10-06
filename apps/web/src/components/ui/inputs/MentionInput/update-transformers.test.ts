import type { Editor } from '@tiptap/react';
import { describe, expect, it, vi } from 'vitest';
import type { MentionSuggestionExtension } from './MentionInput.types';
import type { MentionPillAttributes } from './MentionPill';
import { onUpdateTransformer } from './update-transformers';

describe('onUpdateTransformer', () => {
  it('should preserve newlines between paragraphs', () => {
    const mockEditor = {
      getText: vi.fn().mockReturnValue('Hello\nWorld'),
      getJSON: vi.fn().mockReturnValue({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Hello',
              },
            ],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'World',
              },
            ],
          },
        ],
      }),
    } as unknown as Editor;

    const result = onUpdateTransformer({
      editor: mockEditor,
      mentionsByTrigger: {},
    });

    expect(result.transformedValue).toBe('Hello\nWorld');
    expect(result.arrayValue).toEqual([
      { type: 'text', text: 'Hello' },
      { type: 'text', text: '\n' },
      { type: 'text', text: 'World' },
    ]);
    expect(result.editorText).toBe('Hello\nWorld');
  });

  it('should handle mentions with custom transform in multi-paragraph content', () => {
    const mockEditor = {
      getText: vi.fn().mockReturnValue('Hello @user\nWorld'),
      getJSON: vi.fn().mockReturnValue({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Hello ',
              },
              {
                type: 'mention',
                attrs: {
                  id: 'user123',
                  label: '@user',
                  trigger: '@',
                  value: 'user123',
                },
              },
            ],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'World',
              },
            ],
          },
        ],
      }),
    } as unknown as Editor;

    const mentionsByTrigger: Record<string, MentionSuggestionExtension> = {
      '@': {
        onChangeTransform: (attrs: MentionPillAttributes) => `@[${attrs.value}]`,
      } as MentionSuggestionExtension,
    };

    const result = onUpdateTransformer({
      editor: mockEditor,
      mentionsByTrigger,
    });

    expect(result.transformedValue).toBe('Hello @[user123]\nWorld');
    expect(result.arrayValue).toEqual([
      { type: 'text', text: 'Hello ' },
      { type: 'mention', attrs: { id: 'user123', label: '@user', trigger: '@', value: 'user123' } },
      { type: 'text', text: '\n' },
      { type: 'text', text: 'World' },
    ]);
  });
});
