import type { SlackMessage } from '../types';
import type {
  SlackActionsBlock,
  SlackAttachment,
  SlackBlock,
  SlackBlockElement,
  SlackButtonElement,
  SlackContextBlock,
  SlackDividerBlock,
  SlackSectionBlock,
} from '../types/blocks';

/**
 * Format a simple text message
 */
export function formatSimpleMessage(text: string): SlackMessage {
  return {
    text,
  };
}

/**
 * Format a message with blocks
 */
export function formatBlockMessage(blocks: SlackBlock[], fallbackText?: string): SlackMessage {
  return {
    text: fallbackText || 'New message',
    blocks,
  };
}

/**
 * Create a section block
 */
export function createSectionBlock(
  text: string,
  options?: {
    fields?: Array<{ title: string; value: string }>;
    accessory?: SlackBlockElement;
  }
): SlackSectionBlock {
  const block: SlackSectionBlock = {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text,
    },
  };

  if (options?.fields) {
    block.fields = options.fields.map((field) => ({
      type: 'mrkdwn' as const,
      text: `*${field.title}*\n${field.value}`,
    }));
  }

  if (options?.accessory) {
    block.accessory = options.accessory;
  }

  return block;
}

/**
 * Create an actions block with buttons
 */
export function createActionsBlock(
  actions: Array<{
    text: string;
    value: string;
    style?: 'primary' | 'danger';
    url?: string;
  }>
): SlackActionsBlock {
  return {
    type: 'actions',
    elements: actions.map(
      (action): SlackButtonElement => ({
        type: 'button',
        text: {
          type: 'plain_text',
          text: action.text,
        },
        value: action.value,
        style: action.style,
        url: action.url,
      })
    ),
  };
}

/**
 * Common message templates
 */
export const MessageTemplates = {
  deployment: (data: {
    project: string;
    environment: string;
    version: string;
    status: 'started' | 'success' | 'failed';
    duration?: string;
    url?: string;
  }): SlackMessage => {
    const emoji = data.status === 'success' ? '✅' : data.status === 'failed' ? '❌' : '🚀';
    const statusText =
      data.status === 'started' ? 'Started' : data.status === 'success' ? 'Successful' : 'Failed';

    let messageText = `${emoji} *Deployment ${statusText}*\nProject: ${data.project}\nEnvironment: ${data.environment}\nVersion: ${data.version}`;

    if (data.duration) {
      messageText += `\nDuration: ${data.duration}`;
    }

    const blocks: SlackBlock[] = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: messageText,
        },
      },
    ];

    if (data.url) {
      blocks.push({
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View Details',
            },
            url: data.url,
            style: 'primary',
          },
        ],
      });
    }

    return {
      text: `Deployment ${statusText}: ${data.project}`,
      blocks,
    };
  },

  alert: (data: {
    title: string;
    message: string;
    severity: 'info' | 'warning' | 'error';
    source?: string;
    actions?: Array<{ text: string; url: string }>;
  }): SlackMessage => {
    const emoji = data.severity === 'error' ? '🚨' : data.severity === 'warning' ? '⚠️' : 'ℹ️';
    const color =
      data.severity === 'error' ? 'danger' : data.severity === 'warning' ? 'warning' : 'good';

    const blocks: SlackBlock[] = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${emoji} *${data.title}*\n${data.message}`,
        },
      },
    ];

    if (data.source) {
      const firstBlock = blocks[0] as SlackSectionBlock;
      if (firstBlock.text) {
        firstBlock.text.text += `\n_Source: ${data.source}_`;
      }
    }

    if (data.actions && data.actions.length > 0) {
      blocks.push({
        type: 'actions',
        elements: data.actions.map((action) => ({
          type: 'button',
          text: {
            type: 'plain_text',
            text: action.text,
          },
          url: action.url,
        })),
      });
    }

    return {
      text: `${data.title}: ${data.message}`,
      blocks,
      attachments: [
        {
          color,
          fallback: `${data.title}: ${data.message}`,
        } as SlackAttachment,
      ],
    };
  },
};

/**
 * Format a code block
 */
export function formatCodeBlock(code: string, language?: string): string {
  return `\`\`\`${language || ''}\n${code}\n\`\`\``;
}

/**
 * Format a link
 */
export function formatLink(url: string, text?: string): string {
  return text ? `<${url}|${text}>` : `<${url}>`;
}

/**
 * Format user mention
 */
export function formatUserMention(userId: string): string {
  return `<@${userId}>`;
}

/**
 * Format channel mention
 */
export function formatChannelMention(channelId: string): string {
  return `<#${channelId}>`;
}

/**
 * Create divider block
 */
export function createDividerBlock(): SlackDividerBlock {
  return { type: 'divider' };
}

/**
 * Create context block
 */
export function createContextBlock(
  elements: Array<
    | string
    | { type: 'mrkdwn'; text: string; verbatim?: boolean }
    | { type: 'plain_text'; text: string; emoji?: boolean }
    | { type: 'image'; image_url: string; alt_text: string }
  >
): SlackContextBlock {
  return {
    type: 'context',
    elements: elements.map((el): SlackContextBlock['elements'][number] => {
      if (typeof el === 'string') {
        return { type: 'mrkdwn', text: el };
      }
      if (el.type === 'image') {
        return {
          type: 'image',
          image_url: el.image_url,
          alt_text: el.alt_text,
        };
      }
      if (el.type === 'plain_text') {
        return {
          type: 'plain_text',
          text: el.text,
          ...(el.emoji !== undefined && { emoji: el.emoji }),
        };
      }
      // el.type === 'mrkdwn'
      return {
        type: 'mrkdwn',
        text: el.text,
        ...(el.verbatim !== undefined && { verbatim: el.verbatim }),
      };
    }),
  };
}
