export const getAnimationClasses = (
  animationType: 'fade' | 'slide' | 'typewriter' | 'none',
  isVisible: boolean
): string => {
  const baseClasses = 'transition-all duration-200 ease-in-out';
  
  switch (animationType) {
    case 'fade':
      return `${baseClasses} ${isVisible ? 'opacity-100' : 'opacity-0'}`;
    case 'slide':
      return `${baseClasses} ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-1 opacity-0'}`;
    case 'typewriter':
      return `${baseClasses} ${isVisible ? 'opacity-100' : 'opacity-0'}`;
    case 'none':
    default:
      return '';
  }
};

export const getCursorClasses = (
  cursorStyle: 'blink' | 'solid' | 'underline',
  showCursor: boolean
): string => {
  if (!showCursor) return '';
  
  const baseClasses = 'inline-block ml-0.5';
  
  switch (cursorStyle) {
    case 'blink':
      return `${baseClasses} animate-pulse`;
    case 'solid':
      return `${baseClasses}`;
    case 'underline':
      return `${baseClasses} border-b border-current`;
    default:
      return baseClasses;
  }
};

export const getDefaultCursorChar = (cursorStyle: 'blink' | 'solid' | 'underline'): string => {
  switch (cursorStyle) {
    case 'underline':
      return '_';
    case 'blink':
    case 'solid':
    default:
      return '|';
  }
};

export const splitTextIntoChunks = (
  text: string,
  splitBy: 'character' | 'word' | 'line',
  preserveWhitespace: boolean = true
): string[] => {
  switch (splitBy) {
    case 'character':
      return preserveWhitespace ? text.split('') : text.split('').filter(char => char.trim());
    case 'word':
      return text.split(/(\s+)/).filter(chunk => chunk.length > 0);
    case 'line':
      return text.split('\n');
    default:
      return text.split('');
  }
};

export const createAnimationKeyframes = (animationType: 'fade' | 'slide' | 'typewriter' | 'none') => {
  switch (animationType) {
    case 'fade':
      return {
        from: { opacity: 0 },
        to: { opacity: 1 },
      };
    case 'slide':
      return {
        from: { transform: 'translateX(4px)', opacity: 0 },
        to: { transform: 'translateX(0)', opacity: 1 },
      };
    case 'typewriter':
      return {
        from: { opacity: 0, transform: 'scaleX(0.5)' },
        to: { opacity: 1, transform: 'scaleX(1)' },
      };
    case 'none':
    default:
      return {};
  }
};

export const getAnimationDelay = (index: number, animationSpeed: number): number => {
  return (index * animationSpeed) / 1000; // Convert to seconds
};

export const shouldShowCursor = (
  isAnimating: boolean,
  showCursor: boolean,
  content: string,
  displayedContent: string
): boolean => {
  return showCursor && (isAnimating || displayedContent.length < content.length);
};