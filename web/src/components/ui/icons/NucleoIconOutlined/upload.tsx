import React from 'react';

import type { iconProps } from './iconProps';

function upload(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px upload';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M11.75,7.75h.663c.929,0,1.736,.64,1.948,1.546l.817,3.5c.293,1.254-.66,2.454-1.948,2.454H4.77c-1.288,0-2.24-1.2-1.948-2.454l.817-3.5c.211-.905,1.018-1.546,1.948-1.546h.663"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6 4.75L9 1.75 12 4.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 1.75L9 12.5"
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

export default upload;
