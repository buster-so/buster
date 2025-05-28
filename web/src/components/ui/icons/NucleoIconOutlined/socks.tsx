import React from 'react';

import type { iconProps } from './iconProps';

function socks(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px socks';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M5.75 4.75L11.75 4.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.75,7.743c-1.795,0-3.25,1.455-3.25,3.25,0,.897,.364,1.71,.952,2.298"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.057,16.221c.662-.068,1.307-.342,1.814-.85l3.793-3.793c.375-.375,.586-.884,.586-1.414V3.75c0-.552-.448-1-1-1h-1.163"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.75,10.164V2.75c0-.552-.448-1-1-1H6.75c-.552,0-1,.448-1,1v5.757l-2.501,2.501c-1.149,1.149-1.318,3.039-.231,4.246,1.159,1.287,3.144,1.326,4.354,.117l3.793-3.793c.375-.375,.586-.884,.586-1.414Z"
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

export default socks;
