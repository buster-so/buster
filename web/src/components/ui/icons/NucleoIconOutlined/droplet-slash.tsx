import React from 'react';

import type { iconProps } from './iconProps';

function dropletSlash(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px droplet slash';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m9,13.75c-1.279,0-2.374-.809-2.805-1.946"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m12.454,5.546c-1.04-1.248-2.32-2.389-3.454-3.796-2.417,3-5.5,4.792-5.5,8.983,0,1.076.307,2.08.838,2.929"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m6.5627,15.6799c.7347.3651,1.5625.5701,2.4373.5701,3.038,0,5.5-2.47,5.5-5.517,0-.9612-.1622-1.7967-.4415-2.5489"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2 16L16 2"
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

export default dropletSlash;
