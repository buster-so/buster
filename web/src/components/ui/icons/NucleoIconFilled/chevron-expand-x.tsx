import React from 'react';

import type { iconProps } from './iconProps';

function chevronExpandX(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px chevron expand x';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m8.25,9.5c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061l2.22-2.22-2.22-2.22c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l2.75,2.75c.293.293.293.768,0,1.061l-2.75,2.75c-.146.146-.338.22-.53.22Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m3.75,9.5c-.192,0-.384-.073-.53-.22L.47,6.53c-.293-.293-.293-.768,0-1.061l2.75-2.75c.293-.293.768-.293,1.061,0s.293.768,0,1.061l-2.22,2.22,2.22,2.22c.293.293.293.768,0,1.061-.146.146-.338.22-.53.22Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default chevronExpandX;
