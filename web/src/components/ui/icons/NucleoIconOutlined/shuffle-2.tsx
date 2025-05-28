import React from 'react';

import type { iconProps } from './iconProps';

function shuffle2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px shuffle 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M10,11.731c.882,.62,2.185,1.019,4.25,1.019h2l-2.75,2.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.75,4.75c2.322,0,3.687,.5,4.572,1.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.75,13.25c9.292,0,3.25-8,12.5-8h2l-2.75-2.75"
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

export default shuffle2;
