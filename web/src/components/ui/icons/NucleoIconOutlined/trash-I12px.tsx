import React from 'react';

import type { iconProps } from './iconProps';

function trash(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px trash';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M1 2.25L11 2.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m4.75,2.25v-1c0-.276.224-.5.5-.5h1.5c.276,0,.5.224.5.5v1"
          fill="currentColor"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m9.5,4.75l-.195,5.058c-.031.805-.693,1.442-1.499,1.442h-3.613c-.806,0-1.468-.637-1.499-1.442l-.195-5.058"
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

export default trash;
