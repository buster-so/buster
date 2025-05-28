import React from 'react';

import type { iconProps } from './iconProps';

function musicNote(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px music note';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M8.75 6.25L8.75 13.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.615,2.382l3.5-.477c.6-.082,1.135,.385,1.135,.991v1.731c0,.5-.369,.923-.865,.991l-4.635,.632V3.373c0-.5,.369-.923,.865-.991Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="6"
          cy="13.5"
          fill="none"
          r="2.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default musicNote;
