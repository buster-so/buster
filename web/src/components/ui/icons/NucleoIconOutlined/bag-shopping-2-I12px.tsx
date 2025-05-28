import React from 'react';

import type { iconProps } from './iconProps';

function bagShopping2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px bag shopping 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m8,3.75c0,1.105-.895,2-2,2h0c-1.105,0-2-.895-2-2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m3.754,1.25h4.492c1.004,0,1.852.744,1.983,1.739l.724,5.5c.158,1.198-.775,2.261-1.983,2.261H3.03c-1.208,0-2.141-1.063-1.983-2.261l.724-5.5c.131-.995.979-1.739,1.983-1.739Z"
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

export default bagShopping2;
