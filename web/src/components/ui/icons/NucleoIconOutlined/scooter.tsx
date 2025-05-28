import React from 'react';

import type { iconProps } from './iconProps';

function scooter(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px scooter';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M7,12c0,1.243-1.007,2.25-2.25,2.25s-2.25-1.007-2.25-2.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.25,12c0,1.243,1.007,2.25,2.25,2.25s2.25-1.007,2.25-2.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.25,5.75h-1c-.828,0-1.5-.672-1.5-1.5h0c0-.828,.672-1.5,1.5-1.5h1v3Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.25,2.75h.672c.48,0,.893,.341,.982,.813l.845,4.437"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.763,8.503c.503-.318,1.098-.503,1.737-.503,1.795,0,3.25,1.455,3.25,3.25H1.25v-.5c0-2.209,1.791-4,4-4h2.5c.552,0,1,.448,1,1v3.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="1.5"
          width="4.5"
          fill="currentColor"
          rx=".5"
          ry=".5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="3.75"
          y="4.75"
        />
      </g>
    </svg>
  );
}

export default scooter;
