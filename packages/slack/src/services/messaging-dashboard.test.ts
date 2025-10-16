import type { WebClient } from '@slack/web-api';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockWebClient, type MockWebClient } from '../mocks';
import { convertMarkdownToSlack } from '../utils/markdown-to-slack';
import { SlackMessagingService } from './messaging';

describe('SlackMessagingService - Dashboard Scenarios', () => {
  let messagingService: SlackMessagingService;
  let mockSlackClient: MockWebClient;

  beforeEach(() => {
    mockSlackClient = createMockWebClient();
    messagingService = new SlackMessagingService(mockSlackClient as unknown as WebClient);
  });

  describe('Dashboard message handling', () => {
    it('should preserve button when slack-agent-task sends dashboard response', async () => {
      mockSlackClient.chat.postMessage.mockResolvedValue({
        ok: true,
        ts: '1234567890.123456',
        channel: 'C123',
      });

      // Simulate the exact flow from slack-agent-task.ts
      const responseText = `I've created a comprehensive sales rep performance analysis that addresses all aspects of your request. Here's what I found and built for you:

## Key Performance Insights

### Top Performers by Revenue:
• Linda Mitchell leads with $10.37M in total sales
• Jillian Carson follows closely with $10.07M
• Michael Blythe rounds out the top 3 with $9.29M

### Volume vs Efficiency Leaders:
• Jillian Carson processed the most orders (473 total)
• Pamela Ansman-Wolfe is the most efficient with a productivity score of 35,001 and highest average order value of $35,001
• The analysis reveals different sales strategies - some reps focus on high-volume/lower-value orders while others excel at fewer, high-value transactions

## Quota Achievement:
• 14 out of 17 reps have assigned quotas
• All quota-assigned reps are significantly exceeding their targets (ranging from 569% to over 4,000% achievement)
• Linda Mitchell leads quota achievement at 4,147% of her $250K target

## What I Built
I created a comprehensive dashboard with 10 visualizations covering:
• Key Performance Cards: Top revenue performer, most efficient rep, and highest volume rep
• Revenue Rankings: Horizontal bar chart showing total sales by each rep
• Activity Analysis: Order volume comparison across all reps  
• Efficiency Metrics: Productivity scores and average order values
• Quota Performance: Achievement percentages for reps with assigned quotas
• Relationship Analysis: Scatter plot showing the correlation between order volume and revenue
• Complete Summary Table: All key metrics in one comprehensive view

The analysis uses data from your employee productivity system, which tracks total sales amounts, order counts, and calculated productivity metrics for all 17 sales representatives. This gives you a complete picture of both individual performance and team-wide patterns to inform management decisions and recognize top performers.`;

      // Step 1: Convert markdown to Slack format (as done in slack-agent-task)
      const convertedResponse = convertMarkdownToSlack(responseText);

      // Step 2: Create the message with converted text and any blocks from conversion
      const messageBlocks = [...(convertedResponse.blocks || [])];

      // Step 3: If no blocks were created from conversion, create a section block with the converted text
      if (messageBlocks.length === 0 && convertedResponse.text) {
        messageBlocks.push({
          type: 'section' as const,
          text: {
            type: 'mrkdwn' as const,
            text: convertedResponse.text,
          },
        });
      }

      // Step 4: Add the action button block
      const buttonUrl =
        'https://platform.buster.so/app/chats/123/dashboards/456?dashboard_version_number=1';
      messageBlocks.push({
        type: 'actions' as const,
        elements: [
          {
            type: 'button' as const,
            text: {
              type: 'plain_text' as const,
              text: 'Open in Buster',
              emoji: false,
            },
            url: buttonUrl,
          },
        ],
      });

      // Step 5: Create the completion message
      const completionMessage = {
        text: convertedResponse.text || responseText,
        thread_ts: '1234567890.000001',
        blocks: messageBlocks,
      };

      // Step 6: Send the message
      const result = await messagingService.sendMessage(
        'xoxb-test-token',
        'C123',
        completionMessage
      );

      expect(result.success).toBe(true);

      // Verify the message was sent correctly
      const callArgs = mockSlackClient.chat.postMessage.mock.calls[0][0];

      // The blocks should be preserved as-is
      expect(callArgs.blocks).toBeDefined();
      expect(callArgs.blocks).toEqual(messageBlocks);

      // Verify the button is at the bottom
      const lastBlock = callArgs.blocks[callArgs.blocks.length - 1];
      expect(lastBlock.type).toBe('actions');
      expect(lastBlock.elements).toHaveLength(1);
      expect(lastBlock.elements[0].type).toBe('button');
      expect(lastBlock.elements[0].text.text).toBe('Open in Buster');
      expect(lastBlock.elements[0].url).toBe(buttonUrl);

      // Verify the text content is preserved
      expect(callArgs.text).toBeDefined();
      expect(callArgs.thread_ts).toBe('1234567890.000001');
    });

    it('should handle edge case with many headers without losing button', async () => {
      mockSlackClient.chat.postMessage.mockResolvedValue({
        ok: true,
        ts: '1234567890.123456',
        channel: 'C123',
      });

      // Create a response with many headers that could potentially create many blocks
      const responseWithManyHeaders = `# Dashboard Created

## Section 1
Content 1

## Section 2
Content 2

## Section 3
Content 3

## Section 4
Content 4

## Section 5
Content 5`;

      const convertedResponse = convertMarkdownToSlack(responseWithManyHeaders);
      const messageBlocks = [...(convertedResponse.blocks || [])];

      // Add button at the end
      messageBlocks.push({
        type: 'actions' as const,
        elements: [
          {
            type: 'button' as const,
            text: {
              type: 'plain_text' as const,
              text: 'Open in Buster',
              emoji: false,
            },
            url: 'https://platform.buster.so/app/chats/123/dashboards/456',
          },
        ],
      });

      const message = {
        text: convertedResponse.text || responseWithManyHeaders,
        blocks: messageBlocks,
      };

      const result = await messagingService.sendMessage('xoxb-test-token', 'C123', message);

      expect(result.success).toBe(true);

      const callArgs = mockSlackClient.chat.postMessage.mock.calls[0][0];

      // Verify all blocks including button are present
      expect(callArgs.blocks).toEqual(messageBlocks);

      // Verify button is still at the bottom
      const lastBlock = callArgs.blocks[callArgs.blocks.length - 1];
      expect(lastBlock.type).toBe('actions');
      expect(lastBlock.elements[0].text.text).toBe('Open in Buster');
    });

    it('should not double-convert markdown when blocks are already provided', async () => {
      mockSlackClient.chat.postMessage.mockResolvedValue({
        ok: true,
        ts: '1234567890.123456',
        channel: 'C123',
      });

      const originalText = '## Header\nSome **bold** text';

      // Pre-convert the markdown
      const convertedOnce = convertMarkdownToSlack(originalText);

      // Create message with both text and already-converted blocks
      const message = {
        text: originalText, // Original markdown text
        blocks: [
          ...(convertedOnce.blocks || []),
          {
            type: 'actions' as const,
            elements: [
              {
                type: 'button' as const,
                text: {
                  type: 'plain_text' as const,
                  text: 'Open in Buster',
                  emoji: false,
                },
                url: 'https://platform.buster.so/app/chats/123',
              },
            ],
          },
        ],
      };

      const result = await messagingService.sendMessage('xoxb-test-token', 'C123', message);

      expect(result.success).toBe(true);

      const callArgs = mockSlackClient.chat.postMessage.mock.calls[0][0];

      // Blocks should be exactly what we provided, not re-converted
      expect(callArgs.blocks).toEqual(message.blocks);

      // Verify the button is still there
      const lastBlock = callArgs.blocks[callArgs.blocks.length - 1];
      expect(lastBlock.type).toBe('actions');
    });
  });
});
