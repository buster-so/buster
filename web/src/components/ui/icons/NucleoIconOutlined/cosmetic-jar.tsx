import React from 'react';

import type { iconProps } from './iconProps';

function cosmeticJar(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px cosmetic jar';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M1.75,11.5c0,1.243,2.351,2.25,5.25,2.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.75,9v5c0,1.243,2.351,2.25,5.25,2.25s5.25-1.007,5.25-2.25v-5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.75,10.667c.926-.947,1.5-2.238,1.5-3.667,0-2.899-2.351-5.25-5.25-5.25-1.893,0-3.537,1.011-4.461,2.512"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <ellipse
          cx="7"
          cy="9"
          fill="none"
          rx="5.25"
          ry="2.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default cosmeticJar;
