import React, { useState, useEffect } from 'react';
import type { AnimatedImageProps } from '../types';
import { getAnimationClasses } from '../utils/animation';

export const AnimatedImage: React.FC<AnimatedImageProps> = ({
  src,
  alt,
  isStreaming = false,
  animationType = 'fade',
  placeholder,
  onLoad,
  onError,
  className,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show image immediately if not streaming
    if (!isStreaming) {
      setIsVisible(true);
    } else {
      // Add small delay when streaming for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isStreaming]);

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(false);
    onError?.();
  };

  if (hasError) {
    return (
      <div className={`inline-block px-2 py-1 bg-gray-100 rounded text-sm text-gray-600 ${className}`}>
        [Image failed to load: {alt}]
      </div>
    );
  }

  if (!isVisible) {
    return placeholder ? (
      <div className={`inline-block px-2 py-1 bg-gray-100 rounded text-sm text-gray-500 ${className}`}>
        {placeholder}
      </div>
    ) : null;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`${getAnimationClasses(animationType, isLoaded)} ${className || ''}`}
      onLoad={handleLoad}
      onError={handleError}
      style={{
        transition: 'opacity 0.3s ease-in-out',
        opacity: isLoaded ? 1 : 0.5,
      }}
    />
  );
};