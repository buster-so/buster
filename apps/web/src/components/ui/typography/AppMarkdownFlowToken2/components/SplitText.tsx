import React from 'react';
import type { SplitTextProps } from '../types';
import { splitTextIntoChunks } from '../utils/animation';

export const SplitText: React.FC<SplitTextProps> = ({
  text,
  splitBy,
  preserveWhitespace = true,
  className,
  children,
}) => {
  const chunks = React.useMemo(() => {
    return splitTextIntoChunks(text, splitBy, preserveWhitespace);
  }, [text, splitBy, preserveWhitespace]);

  return (
    <span className={className}>
      {chunks.map((chunk, index) => (
        <React.Fragment key={index}>
          {children(chunks, index)}
        </React.Fragment>
      ))}
    </span>
  );
};