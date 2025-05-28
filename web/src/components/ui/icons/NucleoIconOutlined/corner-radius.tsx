import React from 'react';

import type { iconProps } from './iconProps';

function cornerRadius(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px corner radius';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m2.75,15.25v-6.5c0-3.3137,2.6863-6,6-6h6.5"
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

export default cornerRadius;
