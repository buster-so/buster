import React from 'react';

import type { iconProps } from './iconProps';

function basketShopping(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px basket shopping';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M3 4.25L4.25 0.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 4.25L7.75 0.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.25 4.25L0.75 4.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m10.5,4.25l-.739,4.804c-.15.976-.99,1.696-1.977,1.696h-3.568c-.987,0-1.827-.72-1.977-1.696l-.739-4.804"
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

export default basketShopping;
