'use client';

import type { DropAnimation, Modifier } from '@dnd-kit/core';
import { DragOverlay, defaultDropAnimationSideEffects } from '@dnd-kit/core';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import { animate } from 'framer-motion';
import React, { useEffect, useMemo } from 'react';
import { BusterSortableItemContent } from './_BusterSortableItemContent';
import { NUMBER_OF_COLUMNS } from './helpers';
import type { BusterResizeableGridRow } from './interfaces';

const dropAnimationConfig: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.4'
      }
    }
  })
};

export const BusterSortableOverlay: React.FC<{
  activeId: string | null;
  overlayComponent: React.ReactNode;
  rows: BusterResizeableGridRow[];
}> = ({ overlayComponent, rows, activeId }) => {
  const [scale, setScale] = React.useState(1);

  const { widthOfItem, useSnapToCenter } = useMemo(() => {
    if (activeId === null)
      return {
        widthOfItem: undefined,
        useSnapToCenter: false
      };

    const r = rows.find((row) => row.items.some((item) => item.id === activeId));
    const indexOfItem = r?.items.findIndex((item) => item.id === activeId);

    if (r && indexOfItem !== undefined && indexOfItem !== -1) {
      const widthOfGrid = document.querySelector('.buster-resizeable-grid')?.clientWidth;
      if (widthOfGrid === undefined) {
        // Handle the case where widthOfGrid is undefined
        return { widthOfItem: undefined, useSnapToCenter: false };
      }
      let columnsOfItem = r.columnSizes?.[indexOfItem] || 4;
      const useSnapToCenter = columnsOfItem === 12;
      if (useSnapToCenter) {
        columnsOfItem = 6;
      }
      const widthOfItem = widthOfGrid * (columnsOfItem / NUMBER_OF_COLUMNS);
      return { widthOfItem, useSnapToCenter };
    }

    return { widthOfItem: undefined, useSnapToCenter: false };
  }, [activeId, rows]);

  useEffect(() => {
    if (activeId) {
      animate(scale, 1.0, {
        duration: 0.25,
        onUpdate: setScale,
        ease: [0.18, 0.67, 0.6, 1.22]
      });
    } else {
      setScale(1);
    }
  }, [activeId]);

  return (
    <DragOverlay
      dropAnimation={dropAnimationConfig}
      modifiers={[useSnapToCenter ? snapCenterToCursor : adjustTranslate]}>
      {activeId && (
        <BusterSortableItemContent
          itemId={activeId}
          isDragOverlay={true}
          isDragging={true}
          style={
            {
              maxWidth: widthOfItem,
              height: '100%',
              width: '100%',
              '--scale': scale
            } as React.CSSProperties
          }>
          {overlayComponent}
        </BusterSortableItemContent>
      )}
    </DragOverlay>
  );
};

const adjustTranslate: Modifier = ({ transform }) => {
  return transform;
};
