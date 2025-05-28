import React from 'react';

import type { iconProps } from './iconProps';

function layersPlus(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px layers plus';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M2.665,8.961l5.87-3.091c.292-.154,.64-.154,.932,0l5.87,3.091c.534,.281,.534,1.046,0,1.327l-5.87,3.091c-.292,.154-.64,.154-.932,0l-5.87-3.091c-.534-.281-.534-1.046,0-1.327Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.736,12.875c0,.261-.134,.523-.401,.664l-5.87,3.091c-.292,.154-.64,.154-.932,0l-5.87-3.091c-.267-.141-.401-.402-.401-.664"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.75 0.75L14.75 5.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M17.25 3.25L12.25 3.25"
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

export default layersPlus;
