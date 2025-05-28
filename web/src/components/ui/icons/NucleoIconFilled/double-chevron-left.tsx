import React from 'react';

import type { iconProps } from './iconProps';

function doubleChevronLeft(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px double chevron left';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m5.75,10.75c-.192,0-.384-.073-.53-.22L1.22,6.53c-.293-.293-.293-.768,0-1.061L5.22,1.47c.293-.293.768-.293,1.061,0s.293.768,0,1.061l-3.47,3.47,3.47,3.47c.293.293.293.768,0,1.061-.146.146-.338.22-.53.22Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m10.25,10.75c-.192,0-.384-.073-.53-.22l-4-4c-.293-.293-.293-.768,0-1.061L9.72,1.47c.293-.293.768-.293,1.061,0s.293.768,0,1.061l-3.47,3.47,3.47,3.47c.293.293.293.768,0,1.061-.146.146-.338.22-.53.22Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default doubleChevronLeft;
