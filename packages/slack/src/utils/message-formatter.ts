import { z } from 'zod';
import type { SlackMessage } from '../types';

/**
 * Format a simple text message
 */
export function formatSimpleMessage(text: string, options?: { markdown?: boolean }): SlackMessage {
  return {
    text,
  };
}

/**
 * Format a message with blocks
 */
export function formatBlockMessage(blocks: Array<any>, fallbackText?: string): SlackMessage {
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
    accessory?: any;
  }
): any {
  const block: any = {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text,
    },
  };

  if (options?.fields) {
    block.fields = options.fields.map((field) => ({
      type: 'mrkdwn',
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
): any {
  return {
    type: 'actions',
    elements: actions.map((action) => ({
      type: action.url ? 'button' : 'button',
      text: {
        type: 'plain_text',
        text: action.text,
      },
      value: action.value,
      style: action.style,
      url: action.url,
    })),
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

    const blocks: any[] = [
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

    const blocks: any[] = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${emoji} *${data.title}*\n${data.message}`,
        },
      },
    ];

    if (data.source) {
      blocks[0].text.text += `\n_Source: ${data.source}_`;
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
        },
      ],
    };
  },
};

/**
 * Format a code block
 */
export function formatCodeBlock(code: string, language?: string): string {
  return '```' + (language || '') + '\n' + code + '\n```';
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
export function createDividerBlock(): any {
  return { type: 'divider' };
}

/**
 * Create context block
 */
export function createContextBlock(
  elements: Array<string | { type: string; [key: string]: any }>
): any {
  return {
    type: 'context',
    elements: elements.map((el) => (typeof el === 'string' ? { type: 'mrkdwn', text: el } : el)),
  };
}
