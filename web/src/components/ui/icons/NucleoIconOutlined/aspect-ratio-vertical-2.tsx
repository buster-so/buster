import React from 'react';

import type { iconProps } from './iconProps';

function aspectRatioVertical2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px aspect ratio vertical 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="14.5"
          width="12.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="2.75"
          y="1.75"
        />
        <path
          d="M8.75 13.25L5.75 13.25 5.75 10.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.25 7.75L12.25 4.75 9.25 4.75"
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

export default aspectRatioVertical2;
