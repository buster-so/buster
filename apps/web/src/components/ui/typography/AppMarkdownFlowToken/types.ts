import React from 'react';

export interface AppMarkdownStreamableProps {
  content: string; // Markdown content to render
  animation?: 'fade-in'; // Animation type (currently only supports fade-in)
  animationDuration?: number; // Animation duration in milliseconds
  animationTimingFunction?: string; // CSS timing function (ease, ease-in, ease-out, etc.)
  streaming: boolean; // Whether to enable streaming animation
  separator?: 'word' | 'character' | 'diff'; // How to separate content for animation
  style?: React.CSSProperties; // Inline CSS styles
  className?: string; // CSS class names
  charactersPerSecond?: number; // Rate of character revelation (default: 100)
}

export interface MarkdownBlock {
  content: string;
  type: 'paragraph' | 'heading' | 'bold' | 'italic' | 'code' | 'list' | 'plain' | 'link' | 'strikethrough' | 'blockquote';
  level?: number; // For headings (1-6)
  isVisible: boolean;
  index: number; // Position in the stream
}

export interface UseStreamableOptions {
  content: string;
  streaming: boolean;
  separator?: 'word' | 'character' | 'diff';
  charactersPerSecond?: number; // Default: 100
}

export interface UseStreamableReturn {
  blocks: MarkdownBlock[];
  isComplete: boolean;
  currentIndex: number;
}

export interface AnimationConfig {
  animation: 'fade-in';
  duration: number;
  timingFunction: string;
}