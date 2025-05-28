import React from 'react';

import type { iconProps } from './iconProps';

function flagCheckered(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px flag checkered';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M3.75,3.24c1.161-.808,2.256-1.142,3.281-.984,1.69,.259,2.245,1.709,3.938,1.969,1.013,.155,2.106-.167,3.281-.984v6.563c-1.175,.818-2.268,1.14-3.281,.984-1.692-.26-2.248-1.71-3.938-1.969-1.026-.157-2.12,.177-3.281,.984"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.75,6.521c1.161-.808,2.256-1.142,3.281-.984,1.69,.259,2.245,1.709,3.938,1.969,1.013,.155,2.106-.167,3.281-.984"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.25 2.297L7.25 8.86"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.75 4.182L10.75 10.744"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.75 2L3.75 16"
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

export default flagCheckered;
