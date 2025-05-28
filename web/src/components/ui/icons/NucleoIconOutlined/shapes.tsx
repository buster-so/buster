import React from 'react';

import type { iconProps } from './iconProps';

function shapes(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px shapes';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="13.5"
          cy="6"
          fill="none"
          r="3.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="5.5"
          width="5.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="4.75"
          y="10.75"
        />
        <path
          d="M3.818,1.99L1.189,6.498c-.194,.333,.046,.752,.432,.752H6.879c.386,0,.626-.419,.432-.752L4.682,1.99c-.193-.331-.671-.331-.864,0Z"
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

export default shapes;
