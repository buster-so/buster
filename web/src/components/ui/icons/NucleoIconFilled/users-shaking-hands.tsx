import React from 'react';

import type { iconProps } from './iconProps';

function usersShakingHands(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px users shaking hands';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="3.75" cy="3.5" fill="currentColor" r="2.5" />
        <circle cx="14.25" cy="3.5" fill="currentColor" r="2.5" />
        <path
          d="M8.031,10.368c-.736-.215-1.236-.614-1.484-1.184-.472-1.081-1.172-2.185-2.797-2.185-1.516,0-2.75,1.233-2.75,2.75v4.5c0,.965,.785,1.75,1.75,1.75h2c.965,0,1.75-.785,1.75-1.75v-2.934c.327,.206,.698,.371,1.109,.492,.401,.118,.815-.111,.931-.509,.116-.398-.111-.814-.509-.931Z"
          fill="currentColor"
        />
        <path
          d="M14.25,7c-1.625,0-2.325,1.104-2.797,2.185-.249,.57-.748,.968-1.484,1.184-.397,.116-.625,.533-.509,.931s.53,.625,.931,.509c.411-.121,.782-.286,1.109-.492v2.934c0,.965,.785,1.75,1.75,1.75h2c.965,0,1.75-.785,1.75-1.75v-4.5c0-1.517-1.234-2.75-2.75-2.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default usersShakingHands;
