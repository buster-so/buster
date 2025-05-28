import React from 'react';

import type { iconProps } from './iconProps';

function bellSlash(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px bell slash';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M13.368,4.632c-.726-1.694-2.408-2.882-4.368-2.882h0c-2.623,0-4.75,2.127-4.75,4.75v4.75c0,1.105-.895,2-2,2h2.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8,13.25h7.75c-1.105,0-2-.895-2-2v-3.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.588,15.185c-.095-.117-.237-.185-.388-.185h-2.399c-.151,0-.293,.068-.388,.185-.095,.117-.132,.271-.101,.418,.173,.822,.868,1.397,1.689,1.397s1.516-.575,1.689-1.397c.031-.147-.006-.301-.101-.418Z"
          fill="currentColor"
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

export default bellSlash;
