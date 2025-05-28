import React from 'react';

import type { iconProps } from './iconProps';

function chartDonut2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px chart donut 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M6.754,5.693c.641-.437,1.414-.693,2.246-.693s1.605,.256,2.246,.693l2.853-2.852c-1.385-1.149-3.162-1.841-5.099-1.841s-3.713,.692-5.099,1.841l2.853,2.852Z"
          fill="currentColor"
        />
        <path
          d="M12.307,6.754c.437,.641,.693,1.414,.693,2.246,0,2.206-1.794,4-4,4-.832,0-1.605-.256-2.246-.693l-2.853,2.852c1.385,1.149,3.162,1.841,5.099,1.841,4.411,0,8-3.589,8-8,0-1.936-.692-3.713-1.841-5.099l-2.853,2.852Z"
          fill="currentColor"
        />
        <path
          d="M5,9c0-.833,.257-1.605,.693-2.246L2.841,3.901c-1.149,1.385-1.841,3.163-1.841,5.099s.692,3.713,1.841,5.099l2.853-2.852c-.437-.641-.693-1.414-.693-2.246Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default chartDonut2;
