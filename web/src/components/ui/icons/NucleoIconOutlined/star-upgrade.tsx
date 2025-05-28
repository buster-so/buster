import React from 'react';

import type { iconProps } from './iconProps';

function starUpgrade(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px star upgrade';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9 1.774L11.009 5.844 15.5 6.497 12.25 9.665 13.017 14.138 9 12.026 4.983 14.138 5.75 9.665 2.5 6.497 6.991 5.844 9 1.774z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 15.75L9 16.815"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.837 10.673L16.85 11.002"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.225 2.636L13.851 1.774"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.775 2.636L4.149 1.774"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.163 10.673L1.15 11.002"
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

export default starUpgrade;
