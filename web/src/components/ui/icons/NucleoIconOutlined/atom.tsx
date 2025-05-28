import React from 'react';

import type { iconProps } from './iconProps';

function atom(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px atom';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9,13.145c-.737-.551-1.486-1.199-2.216-1.929C3.557,7.989,1.934,4.382,3.158,3.158c.654-.654,1.99-.495,3.584,.288"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,4.855c.737,.551,1.486,1.199,2.216,1.929,3.227,3.227,4.85,6.834,3.626,8.058-.654,.654-1.99,.495-3.584-.288"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.855,9c.551-.737,1.199-1.486,1.929-2.216,3.227-3.227,6.834-4.85,8.058-3.626,.654,.654,.495,1.99-.288,3.584"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.145,9c-.551,.737-1.199,1.486-1.929,2.216-3.227,3.227-6.834,4.85-8.058,3.626-.654-.654-.495-1.99,.288-3.584"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="9" cy="9" fill="currentColor" r="1" />
      </g>
    </svg>
  );
}

export default atom;
