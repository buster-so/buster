import React from 'react';
import type { FileContainerSegmentProps } from './interfaces';

export const CollectionContainerHeaderSegment: React.FC<FileContainerSegmentProps> = React.memo(
  () => {
    return <div>Collection Container Header</div>;
  }
);

CollectionContainerHeaderSegment.displayName = 'CollectionContainerHeaderSegment';
