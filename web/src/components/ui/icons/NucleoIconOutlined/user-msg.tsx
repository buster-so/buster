import React from 'react';

import type { iconProps } from './iconProps';

function userMsg(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user msg';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="9"
          cy="4.5"
          fill="none"
          r="2.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,9.75c-2.551,0-4.739,1.53-5.709,3.72-.365,.825,.087,1.774,.947,2.045,1.225,.386,2.846,.734,4.762,.734"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.75,10.75h-3.5c-.827,0-1.5,.673-1.5,1.5v1.5c0,.827,.673,1.5,1.5,1.5h.5v2l2.227-2h.773c.827,0,1.5-.673,1.5-1.5v-1.5c0-.827-.673-1.5-1.5-1.5Z"
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

export default userMsg;
