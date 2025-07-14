import React, { useState } from 'react';
import type { AnimatedCodeBlockProps } from '../types';
import { useStreamingThrottle } from '../hooks/useStreamingThrottle';
import { AnimatedText } from './AnimatedText';

export const AnimatedCodeBlock: React.FC<AnimatedCodeBlockProps> = ({
  code,
  language = 'text',
  isStreaming = false,
  animateByLine = false,
  showLineNumbers = false,
  showCopyButton = true,
  throttleRate = 500,
  className,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const lines = code.split('\n');

  if (animateByLine) {
    return (
      <div className={`relative bg-gray-900 rounded-lg p-4 ${className}`}>
        {showCopyButton && (
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        )}
        
        <div className="text-sm text-gray-300 mb-2">
          {language}
        </div>
        
        <pre className="text-sm overflow-x-auto">
          <code className="text-white">
            {lines.map((line, index) => (
              <div key={index} className="flex">
                {showLineNumbers && (
                  <span className="text-gray-500 mr-4 select-none min-w-[2rem] text-right">
                    {index + 1}
                  </span>
                )}
                <AnimatedText
                  content={line}
                  isStreaming={isStreaming}
                  throttleRate={throttleRate}
                  showCursor={false}
                  animationType="typewriter"
                  className="block"
                />
              </div>
            ))}
          </code>
        </pre>
      </div>
    );
  }

  return (
    <div className={`relative bg-gray-900 rounded-lg p-4 ${className}`}>
      {showCopyButton && (
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      )}
      
      <div className="text-sm text-gray-300 mb-2">
        {language}
      </div>
      
      <pre className="text-sm overflow-x-auto">
        <code className="text-white">
          <AnimatedText
            content={code}
            isStreaming={isStreaming}
            throttleRate={throttleRate}
            showCursor={false}
            animationType="typewriter"
          />
        </code>
      </pre>
    </div>
  );
};