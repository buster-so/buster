import { useState, useEffect, useRef, useCallback } from 'react';
import type { UseStreamingThrottleProps, UseStreamingThrottleReturn } from '../types';
import { calculateAnimationInterval, calculateProgress, shouldSkipAnimation } from '../utils/throttle';

export const useStreamingThrottle = ({
  content,
  throttleRate = 500, // 500 chars per minute default
  isStreaming,
  onComplete,
}: UseStreamingThrottleProps): UseStreamingThrottleReturn => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const currentIndexRef = useRef(0);
  const lastContentRef = useRef('');
  
  // Calculate progress
  const progress = calculateProgress(displayedContent.length, content.length);
  
  // Clear existing timer
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);
  
  // Start animation
  const startAnimation = useCallback(() => {
    if (isPaused) return;
    
    const interval = calculateAnimationInterval(throttleRate);
    setIsAnimating(true);
    
    timerRef.current = setInterval(() => {
      setDisplayedContent((prev) => {
        const nextIndex = currentIndexRef.current + 1;
        
        if (nextIndex >= content.length) {
          setIsAnimating(false);
          clearInterval(timerRef.current!);
          timerRef.current = null;
          onComplete?.();
          return content;
        }
        
        currentIndexRef.current = nextIndex;
        return content.slice(0, nextIndex);
      });
    }, interval);
  }, [content, throttleRate, isPaused, onComplete]);
  
  // Handle content changes
  useEffect(() => {
    // If content is the same, no need to update
    if (content === lastContentRef.current) return;
    
    const shouldSkip = shouldSkipAnimation(content, isStreaming, true);
    
    if (shouldSkip) {
      // Show content immediately without animation
      setDisplayedContent(content);
      setIsAnimating(false);
      currentIndexRef.current = content.length;
      onComplete?.();
      return;
    }
    
    // If content changed and we're not at the end, start/restart animation
    if (content !== displayedContent) {
      clearTimer();
      
      // If new content is longer than current displayed content, continue from where we left off
      if (content.startsWith(displayedContent)) {
        currentIndexRef.current = displayedContent.length;
      } else {
        // Content changed completely, start from beginning
        setDisplayedContent('');
        currentIndexRef.current = 0;
      }
      
      startAnimation();
    }
    
    lastContentRef.current = content;
  }, [content, isStreaming, displayedContent, startAnimation, clearTimer, onComplete]);
  
  // Handle streaming state changes
  useEffect(() => {
    if (!isStreaming && displayedContent.length < content.length) {
      // Streaming stopped but we haven't shown all content yet
      // Continue animation until complete
      startAnimation();
    }
  }, [isStreaming, displayedContent.length, content.length, startAnimation]);
  
  // Control functions
  const pause = useCallback(() => {
    setIsPaused(true);
    clearTimer();
  }, [clearTimer]);
  
  const resume = useCallback(() => {
    setIsPaused(false);
    if (displayedContent.length < content.length) {
      startAnimation();
    }
  }, [displayedContent.length, content.length, startAnimation]);
  
  const skip = useCallback(() => {
    clearTimer();
    setDisplayedContent(content);
    setIsAnimating(false);
    currentIndexRef.current = content.length;
    onComplete?.();
  }, [content, clearTimer, onComplete]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);
  
  return {
    displayedContent,
    isAnimating,
    progress,
    pause,
    resume,
    skip,
  };
};