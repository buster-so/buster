export interface UseStreamingThrottleProps {
  content: string;
  throttleRate?: number; // chars per minute, default 500
  isStreaming: boolean;
  onComplete?: () => void;
}

export interface UseStreamingThrottleReturn {
  displayedContent: string;
  isAnimating: boolean;
  progress: number; // 0-1
  pause: () => void;
  resume: () => void;
  skip: () => void;
}

export interface AnimatedTextProps {
  content: string;
  isStreaming?: boolean;
  animationSpeed?: number;
  showCursor?: boolean;
  cursorStyle?: 'blink' | 'solid' | 'underline';
  animationType?: 'fade' | 'slide' | 'typewriter' | 'none';
  onComplete?: () => void;
  // Throttling props
  throttleRate?: number;
  enableThrottling?: boolean;
  className?: string;
}

export interface AnimatedMarkdownProps extends AnimatedTextProps {
  markdown: string;
  renderCodeBlocks?: boolean;
  renderImages?: boolean;
  renderLinks?: boolean;
  codeBlockRenderer?: React.ComponentType<{ code: string; language: string }>;
}

export interface AnimatedCodeBlockProps {
  code: string;
  language?: string;
  isStreaming?: boolean;
  animateByLine?: boolean; // vs character-by-character
  showLineNumbers?: boolean;
  showCopyButton?: boolean;
  throttleRate?: number;
  className?: string;
}

export interface SplitTextProps {
  text: string;
  splitBy: 'character' | 'word' | 'line';
  preserveWhitespace?: boolean;
  className?: string;
  children: (chunks: string[], index: number) => React.ReactNode;
}

export interface AnimatedImageProps {
  src: string;
  alt: string;
  isStreaming?: boolean;
  animationType?: 'fade' | 'slide' | 'blur' | 'none';
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
  className?: string;
}

// Main component props (FlowToken compatibility)
export interface AppMarkdownFlowToken2Props {
  // Original FlowToken props (preserved)
  content: string;
  speed?: number;
  cursor?: boolean;
  cursorChar?: string;
  cursorClassName?: string;
  className?: string;
  onComplete?: () => void;

  // Our throttling enhancements
  throttleRate?: number;
  isStreaming?: boolean;
  enableThrottling?: boolean;
  
  // Markdown specific
  renderCodeBlocks?: boolean;
  renderImages?: boolean;
  renderLinks?: boolean;
  animationType?: 'fade' | 'slide' | 'typewriter' | 'none';
}

export interface AnimationState {
  isAnimating: boolean;
  isPaused: boolean;
  currentIndex: number;
  totalLength: number;
}

export interface MarkdownToken {
  type: 'text' | 'code' | 'image' | 'link' | 'heading' | 'paragraph' | 'list';
  content: string;
  language?: string;
  href?: string;
  alt?: string;
  level?: number;
}