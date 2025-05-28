import React from 'react';

import type { iconProps } from './iconProps';

function mediaPrevious(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px media previous';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M13.95,14.323L5.697,9.753c-.595-.33-.595-1.177,0-1.506L13.95,3.677c.582-.322,1.3,.094,1.3,.753V13.57c0,.66-.718,1.075-1.3,.753Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.75 2.75L2.75 15.25"
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

export default mediaPrevious;
