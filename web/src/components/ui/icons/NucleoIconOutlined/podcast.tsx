import React from 'react';

import type { iconProps } from './iconProps';

function podcast(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px podcast';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="9"
          cy="8.5"
          fill="none"
          r="1.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.789,11.365c.603-.796,.961-1.789,.961-2.865,0-2.623-2.127-4.75-4.75-4.75-2.623,0-4.75,2.127-4.75,4.75,0,1.076,.358,2.069,.961,2.865"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4,14.421c-1.682-1.422-2.75-3.547-2.75-5.921C1.25,4.22,4.72,.75,9,.75s7.75,3.47,7.75,7.75c0,2.375-1.068,4.5-2.75,5.921"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.176,12.75h1.648c.894,0,1.59,.777,1.491,1.666l-.216,1.945c-.056,.506-.484,.89-.994,.89h-2.21c-.51,0-.938-.383-.994-.89l-.216-1.945c-.099-.889,.597-1.666,1.491-1.666Z"
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

export default podcast;
