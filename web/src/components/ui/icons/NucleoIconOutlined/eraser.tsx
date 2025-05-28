import React from 'react';

import type { iconProps } from './iconProps';

function eraser(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px eraser';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M8.75 15.25L16 15.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.876,15.25l-3.402-3.402c-.586-.586-.586-1.536,0-2.121L9.692,2.51c.586-.586,1.536-.586,2.121,0l3.712,3.712c.586,.586,.586,1.536,0,2.121l-6.906,6.907h-2.744Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.083 6.118L11.917 11.952"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default eraser;
