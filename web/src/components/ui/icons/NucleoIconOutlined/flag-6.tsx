import React from 'react';

import type { iconProps } from './iconProps';

function flag6(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px flag 6';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M3.75,3c1.784-.232,3.073,.092,4.021,.625,1.641,.922,1.87,2.249,3.5,3.125,1.254,.674,2.66,.719,3.979,.5-2.075,2.554-3.703,3.051-4.833,3-1.433-.064-2.359-1.021-4.125-.792-1.13,.147-1.995,.701-2.542,1.135"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.75 1.75L3.75 16.25"
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

export default flag6;
