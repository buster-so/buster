import React from 'react';
import type { FileContainerSegmentProps } from './interfaces';

export const TermContainerHeaderSegment: React.FC<FileContainerSegmentProps> = React.memo(() => {
  return <div>Term Container Header</div>;
});

TermContainerHeaderSegment.displayName = 'TermContainerHeaderSegment';
