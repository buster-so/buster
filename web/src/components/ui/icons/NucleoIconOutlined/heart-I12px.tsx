import React from 'react';

import type { iconProps } from './iconProps';

function heart(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px heart';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m5.647,10.884c.223.116.483.116.706,0,1.178-.614,4.897-2.841,4.897-6.461.006-1.59-1.278-2.885-2.87-2.895-.958.012-1.848.495-2.38,1.29-.533-.795-1.423-1.278-2.38-1.29-1.592.01-2.876,1.304-2.87,2.895,0,3.62,3.72,5.846,4.897,6.461h0Z"
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

export default heart;
