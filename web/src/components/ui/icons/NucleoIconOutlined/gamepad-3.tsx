import React from 'react';

import type { iconProps } from './iconProps';

function gamepad3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px gamepad 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle cx="10.75" cy="7.25" fill="currentColor" r=".75" />
        <circle cx="13.75" cy="7.25" fill="currentColor" r=".75" />
        <circle cx="12.25" cy="6" fill="currentColor" r=".75" />
        <circle cx="12.25" cy="8.5" fill="currentColor" r=".75" />
        <circle cx="5.75" cy="11.5" fill="currentColor" r="1.5" />
        <circle cx="12.25" cy="11.5" fill="currentColor" r="1.5" />
        <path
          d="M5.75 6L5.75 8.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7 7.25L4.5 7.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.23 11.75L11.769 11.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.173,13.435c.267,.517,.819,.862,1.452,.81,.802-.065,1.381-.805,1.375-1.609-.008-1.185-.168-2.627-.458-4.261-.671-3.787-2.118-5.625-4.042-5.625-.885,0-1.672,.39-2.221,1h-1.279s-1.279,0-1.279,0c-.549-.61-1.336-1-2.221-1-1.924,0-3.371,1.838-4.042,5.625-.289,1.634-.45,3.075-.458,4.261-.005,.804,.574,1.544,1.375,1.609,.633,.052,1.185-.294,1.452-.81"
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

export default gamepad3;
