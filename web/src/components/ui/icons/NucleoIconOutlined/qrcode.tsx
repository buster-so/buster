import React from 'react';

import type { iconProps } from './iconProps';

function qrcode(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px qrcode';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
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
          x="2.75"
          y="2.75"
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
          x="10.25"
          y="2.75"
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
          x="2.75"
          y="10.25"
        />
        <path d="M4.5 4.5H6V6H4.5z" fill="currentColor" />
        <path d="M12 4.5H13.5V6H12z" fill="currentColor" />
        <path d="M4.5 12H6V13.5H4.5z" fill="currentColor" />
        <path d="M14.5 14.5H16V16H14.5z" fill="currentColor" />
        <path d="M13 13H14.5V14.5H13z" fill="currentColor" />
        <path d="M14.5 11.5H16V13H14.5z" fill="currentColor" />
        <path d="M11 14.5H13V16H11z" fill="currentColor" />
        <path d="M9.5 11.5H11V14.5H9.5z" fill="currentColor" />
        <path d="M11 10H14.5V11.5H11z" fill="currentColor" />
      </g>
    </svg>
  );
}

export default qrcode;
