import React from 'react';

import type { iconProps } from './iconProps';

function usersCloud(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px users cloud';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="7"
          cy="4.75"
          fill="none"
          r="2.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.233,6.86c.24,.087,.497,.14,.767,.14,1.243,0,2.25-1.007,2.25-2.25s-1.007-2.25-2.25-2.25c-.27,0-.527,.052-.767,.14"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.185,10.532c-.899-.644-1.994-1.032-3.185-1.032-2.145,0-4,1.229-4.906,3.02-.4,.791,.028,1.757,.866,2.048,1.031,.358,2.408,.683,4.04,.683,.526,0,1.013-.042,1.483-.1"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15,10.75c-1.131,0-2.058,.837-2.217,1.925-.196-.108-.418-.175-.658-.175-.759,0-1.375,.616-1.375,1.375s.616,1.375,1.375,1.375h2.875c1.243,0,2.25-1.007,2.25-2.25s-1.007-2.25-2.25-2.25Z"
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

export default usersCloud;
