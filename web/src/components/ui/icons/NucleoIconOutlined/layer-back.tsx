import React from 'react';

import type { iconProps } from './iconProps';

function layerBack(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px layer back';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M6.5,12.059l-3.837-2.02c-.267-.141-.401-.402-.401-.664"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.736,9.375c0,.261-.134,.523-.401,.664l-3.835,2.02"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 6L9 17"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.25 15L9 17.25 6.75 15"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.5,8.809l3.837-2.021c.534-.281,.534-1.046,0-1.327l-5.87-3.091c-.292-.154-.64-.154-.932,0L2.665,5.461c-.534,.281-.534,1.046,0,1.327l3.835,2.019"
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

export default layerBack;
