import React from 'react';

import type { iconProps } from './iconProps';

function umbrellaBeach(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px umbrella beach';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M7.722,6.907c1.242-.263,2.13,.553,2.205,.625,.045-.102,.576-1.241,1.868-1.486,1.228-.233,2.108,.537,2.205,.625-.707-3.345-3.993-5.484-7.338-4.777C3.316,2.601,1.178,5.887,1.885,9.232c.053-.12,.546-1.18,1.764-1.464,1.281-.299,2.227,.528,2.31,.603,.04-.096,.522-1.201,1.764-1.464Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.958,8.371c-.707-3.345-.392-6.245,.704-6.477s2.558,2.292,3.265,5.638"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.75,15.75c1.109-.426,2.938-.974,5.25-.974s4.141,.548,5.25,.974"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.207 9.346L9.25 14.776"
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

export default umbrellaBeach;
