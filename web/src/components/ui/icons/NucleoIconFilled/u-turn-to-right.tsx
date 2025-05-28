import React from 'react';

import type { iconProps } from './iconProps';

function uTurnToRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px u turn to right';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m5,11h-1.25c-1.792,0-3.25-1.458-3.25-3.25s1.458-3.25,3.25-3.25h7c.414,0,.75.336.75.75s-.336.75-.75.75H3.75c-.965,0-1.75.785-1.75,1.75s.785,1.75,1.75,1.75h1.25c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m7.75,9.25c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061l2.72-2.72-2.72-2.72c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l3.25,3.25c.293.293.293.768,0,1.061l-3.25,3.25c-.146.146-.338.22-.53.22Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default uTurnToRight;
