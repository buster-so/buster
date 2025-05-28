import React from 'react';

import type { iconProps } from './iconProps';

function windowPaintbrush(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px window paintbrush';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M11.75,9.247l5.086-5.083c.552-.552,.552-1.448,0-2-.552-.552-1.448-.552-2,0l-5.094,5.096"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.75,11.815c2.162,.65,3.917,.704,5.351-.764,.865-.868,.865-2.276,0-3.145s-2.261-.881-3.133,0c-1.418,1.434-.18,2.795-2.218,3.909Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.25,8.284v4.966c0,1.105-.895,2-2,2H3.75c-1.105,0-2-.895-2-2V4.75c0-1.105,.895-2,2-2h6.965"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="4.25" cy="5.25" fill="currentColor" r=".75" />
        <circle cx="6.75" cy="5.25" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default windowPaintbrush;
