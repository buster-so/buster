import React from 'react';

import type { iconProps } from './iconProps';

function key4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px key 4';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle cx="9" cy="4.5" fill="currentColor" r="1" />
        <path
          d="M12.75,5c0-2.071-1.679-3.75-3.75-3.75s-3.75,1.679-3.75,3.75c0,1.435,.816,2.667,2,3.298v6.202l1.75,2.25,1.75-2.25v-1.75l-1.25-1.25,1.25-1.25v-1.952c1.184-.63,2-1.863,2-3.298Z"
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

export default key4;
