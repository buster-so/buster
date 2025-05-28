import React from 'react';

import type { iconProps } from './iconProps';

function obj3dBack(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px obj 3d back';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
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
          d="m6,11.7958l-3.337-1.7568c-.267-.141-.413-.402-.413-.664v-3.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m12,8.548l3.35-1.76c.535-.281.535-1.046,0-1.327l-5.883-3.091c-.146-.077-.307-.116-.467-.116s-.321.038-.467.116l-5.882,3.091c-.535.281-.535,1.046,0,1.327l3.349,1.7595"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m12,11.7968l3.339-1.7578c.267-.141.413-.402.413-.664v-3.25"
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

export default obj3dBack;
