import React from 'react';

import type { iconProps } from './iconProps';

function satelliteDish(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px satellite dish';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M8 10L10 8"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.25,4.75c1.657,0,3,1.343,3,3"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.25,1.75c3.314,0,6,2.686,6,6"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.419,14.419c-2.441,2.441-6.398,2.441-8.839,0s-2.441-6.398,0-8.839L12.419,14.419Z"
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

export default satelliteDish;
