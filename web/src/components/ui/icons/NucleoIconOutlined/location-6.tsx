import React from 'react';

import type { iconProps } from './iconProps';

function location6(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px location 6';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="9"
          cy="5"
          fill="none"
          r="3.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 13.25L9 8.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.75,10.75h1.243c.609,0,1.158,.368,1.388,.932l1.023,2.5c.404,.987-.322,2.068-1.388,2.068H3.984c-1.066,0-1.792-1.081-1.388-2.068l1.023-2.5c.231-.564,.779-.932,1.388-.932h1.243"
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

export default location6;
