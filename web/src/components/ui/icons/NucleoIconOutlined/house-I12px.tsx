import React from 'react';

import type { iconProps } from './iconProps';

function house(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px house';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m1.685,3.5L5.435.934c.34-.233.789-.233,1.129,0l3.75,2.566c.272.186.435.495.435.825v4.425c0,1.105-.895,2-2,2H3.25c-1.105,0-2-.895-2-2v-4.425c0-.33.163-.639.435-.825Z"
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

export default house;
