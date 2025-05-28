import React from 'react';

import type { iconProps } from './iconProps';

function rainbow(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px rainbow';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M7,13.25v-1c0-1.105,.895-2,2-2s2,.895,2,2v1"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.25,13.25v-1c0-2.623,2.127-4.75,4.75-4.75s4.75,2.127,4.75,4.75v1"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.5,13.25v-1c0-4.142,3.358-7.5,7.5-7.5s7.5,3.358,7.5,7.5v1"
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

export default rainbow;
