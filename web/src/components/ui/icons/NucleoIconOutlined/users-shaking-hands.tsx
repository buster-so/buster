import React from 'react';

import type { iconProps } from './iconProps';

function usersShakingHands(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px users shaking hands';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="3.75"
          cy="3.5"
          fill="none"
          r="1.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="14.25"
          cy="3.5"
          fill="none"
          r="1.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.75,12.75v1.5c0,.552-.448,1-1,1H2.75c-.552,0-1-.448-1-1v-4.5c0-1.105,.895-2,2-2h0c1.105,0,1.641,.66,2.109,1.734,.423,.969,1.287,1.406,1.961,1.604"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.25,12.75v1.5c0,.552,.448,1,1,1h2c.552,0,1-.448,1-1v-4.5c0-1.105-.895-2-2-2h0c-1.105,0-1.641,.66-2.109,1.734-.423,.969-1.287,1.406-1.961,1.604"
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

export default usersShakingHands;
