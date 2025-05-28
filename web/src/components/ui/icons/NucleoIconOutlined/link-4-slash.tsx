import React from 'react';

import type { iconProps } from './iconProps';

function link4Slash(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px link 4 slash';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M2 16L16 2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.25,10.75v2.25c0,1.795-1.455,3.25-3.25,3.25h0c-1.041,0-1.967-.489-2.562-1.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.75,7.25v-2.25c0-1.795,1.455-3.25,3.25-3.25h0c1.041,0,1.967,.489,2.562,1.25"
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

export default link4Slash;
