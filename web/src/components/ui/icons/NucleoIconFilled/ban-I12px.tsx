import React from 'react';

import type { iconProps } from './iconProps';

function ban(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px ban';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M1.752 8.254H16.239V9.754H1.752z"
          fill="currentColor"
          transform="rotate(-45 8.996 9.004)"
        />
        <path
          d="M9,17c-4.411,0-8-3.589-8-8S4.589,1,9,1s8,3.589,8,8-3.589,8-8,8Zm0-14.5c-3.584,0-6.5,2.916-6.5,6.5s2.916,6.5,6.5,6.5,6.5-2.916,6.5-6.5-2.916-6.5-6.5-6.5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default ban;
