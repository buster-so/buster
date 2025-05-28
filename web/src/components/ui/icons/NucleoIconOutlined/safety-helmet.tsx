import React from 'react';

import type { iconProps } from './iconProps';

function safetyHelmet(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px safety helmet';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M10.75,3.998c2.6,.757,4.5,3.157,4.5,6.002v2.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.75,12.25v-2.25c0-2.844,1.9-5.245,4.5-6.002"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.25,7.75V3.25c0-.552,.448-1,1-1h1.5c.552,0,1,.448,1,1V7.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="3"
          width="14.5"
          fill="none"
          rx="1.5"
          ry="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="1.75"
          y="12.25"
        />
      </g>
    </svg>
  );
}

export default safetyHelmet;
