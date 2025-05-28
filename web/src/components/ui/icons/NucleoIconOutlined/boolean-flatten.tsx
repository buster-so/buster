import React from 'react';

import type { iconProps } from './iconProps';

function booleanFlatten(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px boolean flatten';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M7.043,7.043c.181-.181,.431-.293,.707-.293h6.5c.552,0,1,.448,1,1v6.5c0,.276-.112,.526-.293,.707"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.043,3.043c.181-.181,.431-.293,.707-.293h6.5c.552,0,1,.448,1,1v6.5c0,.276-.112,.526-.293,.707"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.043,3.043c-.181,.181-.293,.431-.293,.707v6.5c0,.552,.448,1,1,1h3v3c0,.552,.448,1,1,1h6.5c.276,0,.526-.112,.707-.293L3.043,3.043Z"
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

export default booleanFlatten;
