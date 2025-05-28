import React from 'react';

import type { iconProps } from './iconProps';

function magnifier(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px magnifier';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m10.75,11.5c-.192,0-.384-.073-.53-.22l-3.098-3.098c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l3.098,3.098c.293.293.293.768,0,1.061-.146.146-.338.22-.53.22Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m5,9.5C2.519,9.5.5,7.481.5,5S2.519.5,5,.5s4.5,2.019,4.5,4.5-2.019,4.5-4.5,4.5Zm0-7.5c-1.654,0-3,1.346-3,3s1.346,3,3,3,3-1.346,3-3-1.346-3-3-3Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <circle cx="5" cy="5" fill="currentColor" r="1.5" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default magnifier;
