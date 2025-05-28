import React from 'react';

import type { iconProps } from './iconProps';

function paintbrush(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px paintbrush';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M6.956,9.044L13.534,2.466c.621-.621,1.629-.621,2.25,0h0c.621,.621,.621,1.629,0,2.25l-6.578,6.578"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.75,14.706c2.703,.812,4.896,.88,6.689-.955,1.081-1.085,1.081-2.845,0-3.931s-2.826-1.102-3.916,0c-1.773,1.792-.225,3.494-2.773,4.886Z"
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

export default paintbrush;
