import type { MarkdownToken } from '../types';

export const parseMarkdownTokens = (markdown: string): MarkdownToken[] => {
  const tokens: MarkdownToken[] = [];
  const lines = markdown.split('\n');
  
  for (const line of lines) {
    if (line.trim() === '') {
      tokens.push({ type: 'paragraph', content: '\n' });
      continue;
    }
    
    // Headers
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      tokens.push({
        type: 'heading',
        content: headerMatch[2],
        level: headerMatch[1].length,
      });
      continue;
    }
    
    // Code blocks
    const codeBlockMatch = line.match(/^```(\w+)?\s*(.*)$/);
    if (codeBlockMatch) {
      tokens.push({
        type: 'code',
        content: codeBlockMatch[2] || '',
        language: codeBlockMatch[1] || 'text',
      });
      continue;
    }
    
    // Images
    const imageMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
    if (imageMatch) {
      tokens.push({
        type: 'image',
        content: imageMatch[2],
        alt: imageMatch[1],
      });
      continue;
    }
    
    // Links
    const linkMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      tokens.push({
        type: 'link',
        content: linkMatch[1],
        href: linkMatch[2],
      });
      continue;
    }
    
    // Lists
    const listMatch = line.match(/^[\s]*[-*+]\s+(.+)$/);
    if (listMatch) {
      tokens.push({
        type: 'list',
        content: listMatch[1],
      });
      continue;
    }
    
    // Regular text
    tokens.push({
      type: 'text',
      content: line,
    });
  }
  
  return tokens;
};

export const renderMarkdownToken = (token: MarkdownToken): string => {
  switch (token.type) {
    case 'heading':
      return `${'#'.repeat(token.level || 1)} ${token.content}`;
    case 'code':
      return `\`\`\`${token.language || ''}\n${token.content}\n\`\`\``;
    case 'image':
      return `![${token.alt || ''}](${token.content})`;
    case 'link':
      return `[${token.content}](${token.href || ''})`;
    case 'list':
      return `- ${token.content}`;
    case 'paragraph':
    case 'text':
    default:
      return token.content;
  }
};

export const extractPlainText = (markdown: string): string => {
  return markdown
    .replace(/^#{1,6}\s+/gm, '') // Remove headers
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1') // Replace images with alt text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Replace links with text
    .replace(/^[\s]*[-*+]\s+/gm, '') // Remove list markers
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
    .replace(/\*([^*]+)\*/g, '$1') // Remove italic
    .replace(/`([^`]+)`/g, '$1') // Remove inline code
    .trim();
};

export const isCodeBlock = (content: string): boolean => {
  return content.trim().startsWith('```');
};

export const extractCodeLanguage = (codeBlock: string): string => {
  const match = codeBlock.match(/^```(\w+)/);
  return match ? match[1] : 'text';
};

export const extractCodeContent = (codeBlock: string): string => {
  return codeBlock
    .replace(/^```\w*\n?/, '') // Remove opening fence
    .replace(/\n?```$/, '') // Remove closing fence
    .trim();
};

export const preserveMarkdownFormatting = (text: string, displayedLength: number): string => {
  // This function ensures that markdown formatting is preserved during streaming
  // by keeping complete formatting tokens together
  
  const formattingTokens = [
    /\*\*[^*]*\*\*/g, // Bold
    /\*[^*]*\*/g, // Italic
    /`[^`]*`/g, // Inline code
    /\[[^\]]*\]\([^)]*\)/g, // Links
    /!\[[^\]]*\]\([^)]*\)/g, // Images
  ];
  
  let result = text.slice(0, displayedLength);
  
  // Check if we're in the middle of a formatting token
  for (const tokenRegex of formattingTokens) {
    const matches = Array.from(text.matchAll(tokenRegex));
    
    for (const match of matches) {
      const start = match.index!;
      const end = start + match[0].length;
      
      // If we're cutting in the middle of a token, cut before it
      if (start < displayedLength && end > displayedLength) {
        result = text.slice(0, start);
        break;
      }
    }
  }
  
  return result;
};

export const shouldPreserveWhitespace = (token: MarkdownToken): boolean => {
  return token.type === 'code' || token.type === 'paragraph';
};