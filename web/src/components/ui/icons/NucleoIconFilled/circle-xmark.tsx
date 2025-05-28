import React from 'react';

import type { iconProps } from './iconProps';

function circleXmark(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px circle xmark';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m6,0C2.691,0,0,2.691,0,6s2.691,6,6,6,6-2.691,6-6S9.309,0,6,0Zm2.53,7.47c.293.293.293.768,0,1.061-.146.146-.338.22-.53.22s-.384-.073-.53-.22l-1.47-1.47-1.47,1.47c-.146.146-.338.22-.53.22s-.384-.073-.53-.22c-.293-.293-.293-.768,0-1.061l1.47-1.47-1.47-1.47c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l1.47,1.47,1.47-1.47c.293-.293.768-.293,1.061,0s.293.768,0,1.061l-1.47,1.47,1.47,1.47Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default circleXmark;
