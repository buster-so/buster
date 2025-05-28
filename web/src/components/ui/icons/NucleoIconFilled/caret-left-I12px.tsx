import React from 'react';

import type { iconProps } from './iconProps';

function caretLeft(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px caret left';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.094,2.442c-.559-.309-1.242-.288-1.781,.055L3.389,7.522c-.509,.323-.812,.875-.812,1.478s.304,1.155,.812,1.478l7.924,5.025c.286,.181,.611,.271,.937,.271,.29,0,.581-.072,.844-.217,.559-.308,.906-.895,.906-1.533V3.976c0-.638-.347-1.226-.906-1.533Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default caretLeft;
