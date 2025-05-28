import React from 'react';

import type { iconProps } from './iconProps';

function scissorsComb(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px scissors comb';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M11.75 5.25L13.75 5.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.75 7.75L13.75 7.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.75,10.25h2l-.578,3.852c-.091,.605,.378,1.148,.989,1.148h1.089c.552,0,1-.448,1-1V4.75c0-1.105-.895-2-2-2h-2.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.25 13L8.25 2.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.75 13L3.75 2.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="4"
          width="2.5"
          fill="none"
          rx="1.25"
          ry="1.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="1.75"
          y="11.25"
        />
        <rect
          height="4"
          width="2.5"
          fill="none"
          rx="1.25"
          ry="1.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="7.75"
          y="11.25"
        />
      </g>
    </svg>
  );
}

export default scissorsComb;
