import React from 'react';

import type { iconProps } from './iconProps';

function cubeAxis(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px cube axis';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9 3.922L9 1.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.99 12.692L1.765 13.991"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.01 12.692L16.235 13.991"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.157,4.149l-3.57,2.071c-.518,.301-.837,.854-.837,1.453v4.155c0,.599,.319,1.153,.837,1.453l3.57,2.071c.521,.302,1.165,.302,1.686,0l3.57-2.071c.518-.301,.837-.854,.837-1.453V7.673c0-.599-.319-1.153-.837-1.453l-3.57-2.071c-.521-.302-1.165-.302-1.686,0Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.026 6.835L9 9.75 3.974 6.835"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 15.578L9 9.75"
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

export default cubeAxis;
