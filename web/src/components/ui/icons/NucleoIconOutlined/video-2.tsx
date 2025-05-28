import React from 'react';

import type { iconProps } from './iconProps';

function video2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px video 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M11.75,8.75l3.797-1.688c.331-.147,.703,.095,.703,.457v4.961c0,.362-.372,.604-.703,.457l-3.797-1.688"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="8.5"
          width="10"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="1.75"
          y="5.75"
        />
        <circle
          cx="4.25"
          cy="2"
          fill="currentColor"
          r="1.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="9.25" cy="2.5" fill="currentColor" r="1.5" />
      </g>
    </svg>
  );
}

export default video2;
