import type { DraggableAttributes } from '@dnd-kit/core';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities/useSyntheticListeners';
import React from 'react';
import { SelectAxisContainerId } from '../../config';
//I really wanted it at the top level...
import { SelectAxisItemAvailableContainer } from '../../SelectAxisItemAvailableContainer';
import { SelectAxisItemContainer } from '../../SelectAxisItemContainer';

export const SelectAxisItem = React.forwardRef<
  HTMLDivElement,
  {
    id: string;
    zoneId: SelectAxisContainerId;
    className?: string;
    isPlaceholder?: boolean;
    //DRAGGING PROPERTIES
    isDragging?: boolean;
    style?: React.CSSProperties;
    listeners?: SyntheticListenerMap;
    attributes?: DraggableAttributes;
  }
>((props, ref) => {
  const { zoneId } = props;

  if (zoneId === SelectAxisContainerId.Available) {
    return <SelectAxisItemAvailableContainer {...props} ref={ref} />;
  }

  return <SelectAxisItemContainer {...props} ref={ref} />;
});

SelectAxisItem.displayName = 'SelectAxisItem';
