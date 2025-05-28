import React from 'react';

import type { iconProps } from './iconProps';

function circleSignal(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px circle signal';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="9"
          cy="9"
          fill="none"
          r="7.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="9" cy="11.25" fill="currentColor" r=".75" />
        <path
          d="M10.768,9.482c-.452-.452-1.077-.732-1.768-.732-.69,0-1.315,.28-1.768,.732"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.536,7.714c-.905-.905-2.155-1.464-3.536-1.464-1.381,0-2.631,.56-3.536,1.464"
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

export default circleSignal;
