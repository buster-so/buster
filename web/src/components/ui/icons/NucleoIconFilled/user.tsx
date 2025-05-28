import React from 'react';

import type { iconProps } from './iconProps';

function user(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px user';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="6" cy="2.491" fill="currentColor" r="2.5" strokeWidth="0" />
        <path
          d="m10.533,8.639c-.932-1.628-2.669-2.639-4.533-2.639s-3.602,1.011-4.533,2.639c-.249.434-.305.954-.154,1.428.15.472.496.863.947,1.072,1.241.574,2.49.861,3.74.861s2.499-.287,3.74-.861h0c.451-.209.796-.6.947-1.072.151-.474.095-.994-.154-1.427Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default user;
