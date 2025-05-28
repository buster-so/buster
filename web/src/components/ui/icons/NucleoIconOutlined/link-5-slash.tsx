import React from 'react';

import type { iconProps } from './iconProps';

function link5Slash(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px link 5 slash';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M10.768 10.768L11.75 11.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.25 6.25L9 9"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.518,4.947c-.097-.214-.227-.417-.404-.594l-2.018-2.018c-.781-.781-2.047-.781-2.828,0l-1.932,1.932c-.781,.781-.781,2.047,0,2.828l2.018,2.018c.176,.176,.379,.307,.594,.404"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.053,8.482c.214,.097,.417,.227,.594,.404l2.018,2.018c.781,.781,.781,2.047,0,2.828l-1.932,1.932c-.781,.781-2.047,.781-2.828,0l-2.018-2.018c-.176-.176-.307-.379-.404-.594"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2 16L16 2"
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

export default link5Slash;
