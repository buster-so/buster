import React from 'react';

import type { iconProps } from './iconProps';

function squareBulletList(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px square bullet list';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="12.5"
          width="12.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="2.75"
          y="2.75"
        />
        <path
          d="M8.75 9L12.25 9"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.75 6.25L12.25 6.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.75 11.75L12.25 11.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="6" cy="6" fill="currentColor" r="1" strokeWidth="0" />
        <circle cx="6" cy="9" fill="currentColor" r="1" strokeWidth="0" />
        <circle cx="6" cy="12" fill="currentColor" r="1" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default squareBulletList;
