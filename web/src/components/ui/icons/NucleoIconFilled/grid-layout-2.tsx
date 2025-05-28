import React from 'react';

import type { iconProps } from './iconProps';

function gridLayout2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px grid layout 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect
          height="6"
          width="4.5"
          fill="currentColor"
          rx="1.75"
          ry="1.75"
          strokeWidth="0"
          x="11.5"
          y="2"
        />
        <rect
          height="6"
          width="7.5"
          fill="currentColor"
          rx="1.75"
          ry="1.75"
          strokeWidth="0"
          x="2"
          y="2"
        />
        <rect
          height="6"
          width="4.5"
          fill="currentColor"
          rx="1.75"
          ry="1.75"
          strokeWidth="0"
          x="2"
          y="10"
        />
        <rect
          height="6"
          width="7.5"
          fill="currentColor"
          rx="1.75"
          ry="1.75"
          strokeWidth="0"
          x="8.5"
          y="10"
        />
      </g>
    </svg>
  );
}

export default gridLayout2;
