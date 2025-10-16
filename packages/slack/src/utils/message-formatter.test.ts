import { describe, expect, it } from 'vitest';
import {
  createActionsBlock,
  createContextBlock,
  createDividerBlock,
  createSectionBlock,
  formatBlockMessage,
  formatChannelMention,
  formatCodeBlock,
  formatLink,
  formatSimpleMessage,
  formatUserMention,
  MessageTemplates,
} from './message-formatter';

describe('message-formatter', () => {
  describe('formatSimpleMessage', () => {
    it('should format a simple text message', () => {
      const message = formatSimpleMessage('Hello, Slack!');

      expect(message).toEqual({
        text: 'Hello, Slack!',
      });
    });
  });

  describe('formatBlockMessage', () => {
    it('should format a message with blocks and fallback text', () => {
      const blocks = [
        {
          type: 'section' as const,
          text: {
            type: 'mrkdwn' as const,
            text: 'Hello, world!',
          },
        },
      ];

      const message = formatBlockMessage(blocks, 'Fallback text');

      expect(message).toEqual({
        text: 'Fallback text',
        blocks,
      });
    });

    it('should use default fallback text when not provided', () => {
      const blocks = [
        {
          type: 'divider' as const,
        },
      ];

      const message = formatBlockMessage(blocks);

      expect(message.text).toBe('New message');
    });
  });

  describe('createSectionBlock', () => {
    it('should create a section block with text', () => {
      const block = createSectionBlock('Hello, world!');

      expect(block).toEqual({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'Hello, world!',
        },
      });
    });

    it('should create a section block with fields', () => {
      const block = createSectionBlock('Header', {
        fields: [
          { title: 'Field 1', value: 'Value 1' },
          { title: 'Field 2', value: 'Value 2' },
        ],
      });

      expect(block.fields).toHaveLength(2);
      expect(block.fields?.[0]).toEqual({
        type: 'mrkdwn',
        text: '*Field 1*\nValue 1',
      });
    });
  });

  describe('createActionsBlock', () => {
    it('should create an actions block with buttons', () => {
      const block = createActionsBlock([
        { text: 'Approve', value: 'approve_123', style: 'primary' },
        { text: 'Reject', value: 'reject_123', style: 'danger' },
      ]);

      expect(block.type).toBe('actions');
      expect(block.elements).toHaveLength(2);
      expect(block.elements[0]).toEqual({
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'Approve',
        },
        value: 'approve_123',
        style: 'primary',
        url: undefined,
      });
    });

    it('should create button with URL', () => {
      const block = createActionsBlock([
        { text: 'View Details', value: 'view', url: 'https://example.com' },
      ]);

      expect(block.elements[0]).toMatchObject({
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'View Details',
        },
        value: 'view',
        url: 'https://example.com',
      });
    });
  });

  describe('createContextBlock', () => {
    it('should handle string elements', () => {
      const block = createContextBlock(['Context text 1', 'Context text 2']);

      expect(block).toEqual({
        type: 'context',
        elements: [
          { type: 'mrkdwn', text: 'Context text 1' },
          { type: 'mrkdwn', text: 'Context text 2' },
        ],
      });
    });

    it('should handle mixed element types', () => {
      const block = createContextBlock([
        'Markdown text',
        { type: 'plain_text', text: 'Plain text', emoji: true },
        { type: 'image', image_url: 'https://example.com/img.png', alt_text: 'Image' },
      ]);

      expect(block.elements).toHaveLength(3);
      expect(block.elements[0].type).toBe('mrkdwn');
      expect(block.elements[1].type).toBe('plain_text');
      expect(block.elements[2].type).toBe('image');
    });
  });

  describe('createDividerBlock', () => {
    it('should create a divider block', () => {
      const block = createDividerBlock();

      expect(block).toEqual({
        type: 'divider',
      });
    });
  });

  describe('formatting helpers', () => {
    describe('mentions', () => {
      it('should format user mention', () => {
        expect(formatUserMention('U123456')).toBe('<@U123456>');
      });

      it('should format channel mention', () => {
        expect(formatChannelMention('C123456')).toBe('<#C123456>');
      });
    });

    describe('formatLink', () => {
      it('should format URL without text', () => {
        expect(formatLink('https://example.com')).toBe('<https://example.com>');
      });

      it('should format URL with text', () => {
        expect(formatLink('https://example.com', 'Example')).toBe('<https://example.com|Example>');
      });
    });

    describe('formatCodeBlock', () => {
      it('should format code block without language', () => {
        const code = formatCodeBlock('const x = 5;');

        expect(code).toBe('```\nconst x = 5;\n```');
      });

      it('should format code block with language', () => {
        const code = formatCodeBlock('const x = 5;', 'javascript');

        expect(code).toBe('```javascript\nconst x = 5;\n```');
      });
    });
  });

  describe('MessageTemplates', () => {
    describe('deployment', () => {
      it('should create deployment success message', () => {
        const message = MessageTemplates.deployment({
          project: 'my-app',
          environment: 'production',
          version: '1.2.3',
          status: 'success',
          duration: '2m 30s',
          url: 'https://example.com/deploy/123',
        });

        expect(message.text).toBe('Deployment Successful: my-app');
        expect(message.blocks).toHaveLength(2); // Section + actions
        expect(message.blocks?.[0]).toMatchObject({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: expect.stringContaining('✅ *Deployment Successful*'),
          },
        });
        expect(message.blocks?.[1]).toMatchObject({
          type: 'actions',
          elements: expect.arrayContaining([
            expect.objectContaining({ url: 'https://example.com/deploy/123' }),
          ]),
        });
      });

      it('should create deployment failure message', () => {
        const message = MessageTemplates.deployment({
          project: 'my-app',
          environment: 'staging',
          version: '1.2.3',
          status: 'failed',
        });

        expect(message.text).toBe('Deployment Failed: my-app');
        expect((message.blocks?.[0] as { text?: { text?: string } })?.text?.text).toContain(
          '❌ *Deployment Failed*'
        );
      });
    });

    describe('alert', () => {
      it('should create alert message with actions', () => {
        const message = MessageTemplates.alert({
          title: 'High CPU Usage',
          message: 'CPU usage is at 95%',
          severity: 'error',
          source: 'monitoring-system',
          actions: [{ text: 'View Dashboard', url: 'https://example.com/dashboard' }],
        });

        expect(message.blocks).toHaveLength(2); // Section + actions
        expect(message.blocks?.[0]).toMatchObject({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: expect.stringContaining('🚨 *High CPU Usage*'),
          },
        });
        expect((message.blocks?.[0] as { text?: { text?: string } })?.text?.text).toContain(
          'Source: monitoring-system'
        );
        expect(message.blocks?.[1]).toMatchObject({
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View Dashboard',
              },
              url: 'https://example.com/dashboard',
            },
          ],
        });
      });

      it('should use appropriate emoji for different severities', () => {
        const warningAlert = MessageTemplates.alert({
          title: 'Test',
          message: 'Test',
          severity: 'warning',
        });

        const infoAlert = MessageTemplates.alert({
          title: 'Test',
          message: 'Test',
          severity: 'info',
        });

        expect((warningAlert.blocks?.[0] as { text?: { text?: string } })?.text?.text).toContain(
          '⚠️'
        );
        expect((infoAlert.blocks?.[0] as { text?: { text?: string } })?.text?.text).toContain('ℹ️');
      });
    });
  });
});
