import React from 'react';

import type { iconProps } from './iconProps';

function bicycle2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px bicycle 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="13.75"
          cy="11.25"
          fill="none"
          r="3"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.25,11.25c0,1.657-1.343,3-3,3s-3-1.343-3-3,1.343-3,3-3c.683,0,1.314,.229,1.818,.613"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.75,11.25l-3.147-7.392c-.157-.369-.519-.608-.92-.608h-1.183"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.25,4.75h1.982l2.471,5.804c.14,.33-.102,.696-.46,.696h-2.984c-.414,0-.648-.474-.398-.803l2.435-3.197h4.75"
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

export default bicycle2;
