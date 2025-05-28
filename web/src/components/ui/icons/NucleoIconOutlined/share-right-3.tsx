import React from 'react';

import type { iconProps } from './iconProps';

function shareRight3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px share right 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9.75,6.5V2.75s6.5,5.667,6.5,5.667l-6.5,5.833v-3.75c-5.25,0-8,3.75-8,3.75,0,0,0-7.75,8-7.75Z"
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

export default shareRight3;
