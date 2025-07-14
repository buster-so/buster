import { useState, useCallback, useEffect } from 'react';
import type { AnimationState } from '../types';

export interface UseAnimationStateProps {
  content: string;
  isAnimating: boolean;
  animationSpeed?: number;
  onComplete?: () => void;
}

export interface UseAnimationStateReturn extends AnimationState {
  setAnimating: (animating: boolean) => void;
  setPaused: (paused: boolean) => void;
  setCurrentIndex: (index: number) => void;
  reset: () => void;
  canAnimate: boolean;
}

export const useAnimationState = ({
  content,
  isAnimating,
  animationSpeed = 50,
  onComplete,
}: UseAnimationStateProps): UseAnimationStateReturn => {
  const [state, setState] = useState<AnimationState>({
    isAnimating: false,
    isPaused: false,
    currentIndex: 0,
    totalLength: content.length,
  });

  // Update total length when content changes
  useEffect(() => {
    setState(prev => ({
      ...prev,
      totalLength: content.length,
    }));
  }, [content.length]);

  // Update animation state when external isAnimating changes
  useEffect(() => {
    setState(prev => ({
      ...prev,
      isAnimating,
    }));
  }, [isAnimating]);

  // Check if animation is complete
  useEffect(() => {
    if (state.currentIndex >= state.totalLength && state.isAnimating) {
      setState(prev => ({
        ...prev,
        isAnimating: false,
      }));
      onComplete?.();
    }
  }, [state.currentIndex, state.totalLength, state.isAnimating, onComplete]);

  const setAnimating = useCallback((animating: boolean) => {
    setState(prev => ({
      ...prev,
      isAnimating: animating,
    }));
  }, []);

  const setPaused = useCallback((paused: boolean) => {
    setState(prev => ({
      ...prev,
      isPaused: paused,
    }));
  }, []);

  const setCurrentIndex = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      currentIndex: Math.max(0, Math.min(index, prev.totalLength)),
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      isAnimating: false,
      isPaused: false,
      currentIndex: 0,
      totalLength: content.length,
    });
  }, [content.length]);

  const canAnimate = state.currentIndex < state.totalLength && !state.isPaused;

  return {
    ...state,
    setAnimating,
    setPaused,
    setCurrentIndex,
    reset,
    canAnimate,
  };
};