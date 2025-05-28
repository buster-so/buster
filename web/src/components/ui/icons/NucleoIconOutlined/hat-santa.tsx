import React from 'react';

import type { iconProps } from './iconProps';

function hatSanta(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px hat santa';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M2.979,6.75C3.75,3.87,6.377,1.75,9.5,1.75c3.728,0,6.75,3.022,6.75,6.75v5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.764,13.091c-.486-.176-1.165-.129-1.513,.442-.349-.571-1.027-.618-1.513-.442-.969,.351-1.672,1.463-2.681,1.338-.208-.026-.374,.166-.279,.343,.534,.996,1.591,1.229,2.183,1.229,.679,0,1.673-.414,2.289-1.341,.616,.928,1.61,1.341,2.289,1.341,.592,0,1.65-.233,2.183-1.229,.095-.177-.072-.369-.279-.343-1.008,.127-1.712-.987-2.681-1.338h.002Z"
          fill="currentColor"
        />
        <path
          d="M13.75 13.5L13.75 8.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="15"
          cy="15"
          fill="none"
          r="1.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="3.5"
          width="3.5"
          fill="none"
          rx="1.5"
          ry="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="1.75"
          y="6.75"
        />
      </g>
    </svg>
  );
}

export default hatSanta;
