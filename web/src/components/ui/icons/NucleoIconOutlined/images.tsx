import React from 'react';

import type { iconProps } from './iconProps';

function images(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px images';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M4,15.25l5.836-5.836c.781-.781,2.047-.781,2.828,0l3.086,3.086"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.75 1.75L13.25 1.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="10.5"
          width="13.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="2.25"
          y="4.75"
        />
        <circle cx="5.75" cy="8.25" fill="currentColor" r="1.25" />
      </g>
    </svg>
  );
}

export default images;
