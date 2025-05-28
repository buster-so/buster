import React from 'react';

import type { iconProps } from './iconProps';

function bookmarkPlus2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px bookmark plus 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M14.181,3.257c-.221-.865-.998-1.507-1.931-1.507H5.75c-1.105,0-2,.896-2,2v12.5l5.25-3.5,5.25,3.5v-3"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.25 5.75L14.25 10.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.75 8.25L11.75 8.25"
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

export default bookmarkPlus2;
