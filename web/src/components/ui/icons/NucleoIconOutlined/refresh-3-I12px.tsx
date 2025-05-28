import React from 'react';

import type { iconProps } from './iconProps';

function refresh3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px refresh 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m.754,6.201c.105,2.807,2.414,5.049,5.246,5.049,2.072,0,3.896-1.257,4.75-3v3"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m11.246,5.799c-.105-2.807-2.414-5.049-5.246-5.049C3.928.75,2.104,2.007,1.25,3.75V.75"
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

export default refresh3;
