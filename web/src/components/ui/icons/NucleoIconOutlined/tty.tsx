import React from 'react';

import type { iconProps } from './iconProps';

function tty(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px tty';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m11.75,7.25c0,.553.449,1,1.002,1h2.498c.552,0,1-.448,1-1v-.962c0-.685-.344-1.321-.923-1.688-1.244-.787-3.439-1.85-6.327-1.85s-5.083,1.063-6.327,1.85c-.579.366-.923,1.002-.923,1.688v.962c0,.552.448,1,1,1h2.501c.552,0,.999-.447,1-.999l.002-1.672c.825-.2,1.744-.329,2.747-.329s1.922.128,2.747.329l.003,1.671Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.25 15.25L6.75 15.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="1.5"
          width="1.5"
          fill="currentColor"
          rx=".5"
          ry=".5"
          strokeWidth="0"
          x="6.875"
          y="12"
        />
        <rect
          height="1.5"
          width="1.5"
          fill="currentColor"
          rx=".5"
          ry=".5"
          strokeWidth="0"
          x="4.125"
          y="12"
        />
        <rect
          height="1.5"
          width="1.5"
          fill="currentColor"
          rx=".5"
          ry=".5"
          strokeWidth="0"
          x="9.625"
          y="12"
        />
        <rect
          height="1.5"
          width="1.5"
          fill="currentColor"
          rx=".5"
          ry=".5"
          strokeWidth="0"
          x="12.375"
          y="12"
        />
        <rect
          height="1.5"
          width="1.5"
          fill="currentColor"
          rx=".5"
          ry=".5"
          strokeWidth="0"
          x="5.5"
          y="10"
        />
        <rect
          height="1.5"
          width="1.5"
          fill="currentColor"
          rx=".5"
          ry=".5"
          strokeWidth="0"
          x="8.25"
          y="10"
        />
        <rect
          height="1.5"
          width="1.5"
          fill="currentColor"
          rx=".5"
          ry=".5"
          strokeWidth="0"
          x="11"
          y="10"
        />
      </g>
    </svg>
  );
}

export default tty;
