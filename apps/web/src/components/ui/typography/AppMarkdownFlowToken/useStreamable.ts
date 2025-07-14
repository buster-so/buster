import { useEffect, useState, useRef, useCallback } from 'react';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import type { UseStreamableOptions, UseStreamableReturn, MarkdownBlock } from './types';

const READ_AHEAD_BUFFER = 8;
const DEFAULT_CHARS_PER_SECOND = 100;

export function useStreamable(options: UseStreamableOptions): UseStreamableReturn {
  const {
    content,
    streaming,
    separator = 'character',
    charactersPerSecond = DEFAULT_CHARS_PER_SECOND
  } = options;

  const [blocks, setBlocks] = useState<MarkdownBlock[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousContentRef = useRef<string>('');

  // Function to detect markdown component type using read-ahead
  const detectComponentType = useCallback((content: string, position: number): MarkdownBlock['type'] => {
    const ahead = content.slice(position, position + READ_AHEAD_BUFFER);
    const fullLine = content.slice(position, content.indexOf('\n', position));
    
    // Check for headings
    if (ahead.match(/^#{1,6}\s/)) return 'heading';
    
    // Check for bold
    if (ahead.startsWith('**')) return 'bold';
    
    // Check for italic
    if (ahead.startsWith('*') && !ahead.startsWith('**')) return 'italic';
    
    // Check for code
    if (ahead.startsWith('`')) return 'code';
    
    // Check for links
    if (ahead.startsWith('[')) return 'link';
    
    // Check for strikethrough
    if (ahead.startsWith('~~')) return 'strikethrough';
    
    // Check for blockquotes
    if (ahead.startsWith('>')) return 'blockquote';
    
    // Check for lists
    if (ahead.match(/^[\-\*\+]\s/) || ahead.match(/^\d+\.\s/)) return 'list';
    
    // Check for paragraph (non-empty line)
    if (fullLine.trim() && !fullLine.match(/^#{1,6}\s/)) return 'paragraph';
    
    return 'plain';
  }, []);

  // Function to get heading level
  const getHeadingLevel = useCallback((content: string, position: number): number => {
    const ahead = content.slice(position, position + READ_AHEAD_BUFFER);
    const match = ahead.match(/^(#{1,6})\s/);
    return match ? match[1].length : 1;
  }, []);

  // Function to parse content into blocks based on separator
  const parseContentIntoBlocks = useMemoizedFn((content: string, separator: string): MarkdownBlock[] => {
    if (!content) return [];

    let chunks: string[] = [];
    
    switch (separator) {
      case 'word':
        chunks = content.split(/(\s+)/).filter(chunk => chunk.length > 0);
        break;
      case 'character':
        chunks = content.split('');
        break;
      case 'diff':
        // For diff mode, treat each line as a chunk
        chunks = content.split('\n').map(line => line + '\n');
        break;
      default:
        chunks = content.split('');
    }

    return chunks.map((chunk, index) => {
      const position = chunks.slice(0, index).join('').length;
      const type = detectComponentType(content, position);
      const level = type === 'heading' ? getHeadingLevel(content, position) : undefined;
      
      return {
        content: chunk,
        type,
        level,
        isVisible: false,
        index
      };
    });
  });

  // Function to start streaming animation
  const startStreaming = useCallback(() => {
    if (!streaming || isComplete) return;

    const intervalMs = 1000 / charactersPerSecond;
    
    intervalRef.current = setInterval(() => {
      setCurrentIndex(prevIndex => {
        const newIndex = prevIndex + 1;
        
        setBlocks(prevBlocks => {
          if (newIndex >= prevBlocks.length) {
            setIsComplete(true);
            return prevBlocks.map(block => ({ ...block, isVisible: true }));
          }
          
          return prevBlocks.map((block, index) => ({
            ...block,
            isVisible: index <= newIndex
          }));
        });
        
        return newIndex;
      });
    }, intervalMs);
  }, [streaming, isComplete, charactersPerSecond]);

  // Function to stop streaming animation
  const stopStreaming = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Initialize blocks when content changes
  useEffect(() => {
    if (content !== previousContentRef.current) {
      previousContentRef.current = content;
      const newBlocks = parseContentIntoBlocks(content, separator);
      setBlocks(newBlocks);
      setCurrentIndex(0);
      setIsComplete(false);
      
      if (!streaming) {
        // Show all blocks immediately if not streaming
        setBlocks(newBlocks.map(block => ({ ...block, isVisible: true })));
        setIsComplete(true);
      }
    }
  }, [content, separator, streaming, parseContentIntoBlocks]);

  // Handle streaming state changes
  useEffect(() => {
    if (streaming && blocks.length > 0 && !isComplete) {
      startStreaming();
    } else {
      stopStreaming();
    }

    return () => {
      stopStreaming();
    };
  }, [streaming, blocks.length, isComplete, startStreaming, stopStreaming]);

  // Handle completion
  useEffect(() => {
    if (currentIndex >= blocks.length - 1 && blocks.length > 0) {
      setIsComplete(true);
      stopStreaming();
    }
  }, [currentIndex, blocks.length, stopStreaming]);

  return {
    blocks,
    isComplete,
    currentIndex
  };
}