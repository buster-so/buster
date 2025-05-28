import React from 'react';

import type { iconProps } from './iconProps';

function scaleFromBottomRight2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px scale from bottom right 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M15.25,7.25v-2.5c0-1.105-.895-2-2-2H4.75c-1.105,0-2,.895-2,2V13.25c0,1.105,.895,2,2,2h2.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="6"
          width="6"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(180 12.25 12.25)"
          x="9.25"
          y="9.25"
        />
      </g>
    </svg>
  );
}

export default scaleFromBottomRight2;
