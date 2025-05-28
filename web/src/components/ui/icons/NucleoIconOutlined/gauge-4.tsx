import React from 'react';

import type { iconProps } from './iconProps';

function gauge4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px gauge 4';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="9"
          cy="12"
          fill="currentColor"
          r="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.75,12.25h3.487c.003-.083,.013-.166,.013-.25,0-4.004-3.246-7.25-7.25-7.25S1.75,7.996,1.75,12c0,.084,.01,.167,.013,.25h3.487"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.495 11.137L6.557 7.827"
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

export default gauge4;
