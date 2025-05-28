import React from 'react';

import type { iconProps } from './iconProps';

function bracketsCurly(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px brackets curly';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m7.75,10.75c1.105,0,2-.895,2-2v-1.25c0-.828.672-1.5,1.5-1.5-.828,0-1.5-.672-1.5-1.5v-1.25c0-1.105-.895-2-2-2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m4.25,10.75c-1.105,0-2-.895-2-2v-1.25c0-.828-.672-1.5-1.5-1.5.828,0,1.5-.672,1.5-1.5v-1.25c0-1.105.895-2,2-2"
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

export default bracketsCurly;
