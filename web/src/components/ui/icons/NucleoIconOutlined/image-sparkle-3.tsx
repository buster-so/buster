import React from 'react';

import type { iconProps } from './iconProps';

function imageSparkle3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px image sparkle 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M4,14.75l5.836-5.836c.781-.781,2.047-.781,2.828,0l3.586,3.586"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.25,8.5v4.25c0,1.105-.895,2-2,2H3.75c-1.105,0-2-.895-2-2V5.25c0-1.105,.895-2,2-2h5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.25 0.75L15.1 2.9 17.25 3.75 15.1 4.6 14.25 6.75 13.4 4.6 11.25 3.75 13.4 2.9 14.25 0.75z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="5.75" cy="7.25" fill="currentColor" r="1.25" />
      </g>
    </svg>
  );
}

export default imageSparkle3;
