import React from 'react';

import type { iconProps } from './iconProps';

function bikeDelivery(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px bike delivery';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M6.75,12.75c0,1.657-1.343,3-3,3s-3-1.343-3-3,1.343-3,3-3c.576,0,1.114,.162,1.571,.444"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.189 12.617L5.469 6.725"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.32,8.568l-2.102,3.421c-.205,.333,.035,.762,.426,.762h3.047c.348,0,.67-.18,.852-.477l3.319-5.402"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.25,12.75L10.594,3.75h3.406c.69,0,1.25,.56,1.25,1.25h0c0,.69-.56,1.25-1.25,1.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.862,6.871c-.64,.425-1.602,.961-2.862,1.316-1.054,.297-1.984,.375-2.68,.38"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.75 1.75L3.75 3.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="14.25"
          cy="12.75"
          fill="none"
          r="3"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="5"
          width="5"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="1.25"
          y="1.75"
        />
      </g>
    </svg>
  );
}

export default bikeDelivery;
